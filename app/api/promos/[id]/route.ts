import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/mongodb";
import Promo from "@/models/Promo";
import User from "@/models/User";
import OnlineOrder from "@/models/OnlineOrder";

import {
  ADMIN_SESSION_COOKIE,
  getAdminSession,
  type AdminSession,
} from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["OWNER", "ADMIN", "STAFF"] as const;

type RouteContext = {
  params: Promise<{ id: string }>;
};

type PromoInput = {
  code?: unknown;
  description?: unknown;
  discountType?: unknown;
  discountValue?: unknown;
  minimumOrder?: unknown;
  usageLimit?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  isActive?: unknown;
};

type ValidatedPromoData = {
  code: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minimumOrder: number;
  usageLimit: number | null;
  startDate: Date | null;
  endDate: Date | null;
  isActive: boolean;
};

// ======================================================
// RESPONSE HELPERS
// ======================================================

function errorResponse(error: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

// ======================================================
// AUTHENTICATION
// ======================================================

async function getAdmin(request: NextRequest): Promise<AdminSession | null> {
  // 1. Read the signed admin session cookie.
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  // 2. Verify the session signature and expiration.
  const admin = getAdminSession(token);

  if (
    !admin ||
    !ALLOWED_ROLES.includes(admin.role as (typeof ALLOWED_ROLES)[number])
  ) {
    return null;
  }

  // 3. Verify every role against MongoDB.
  // No ADMIN_EMAIL or environment-based OWNER bypass.
  await connectDB();

  const user = await User.findOne({
    email: admin.email.trim().toLowerCase(),
    role: admin.role,
    status: "ACTIVE",
  })
    .select("_id email role status")
    .maxTimeMS(15000)
    .lean()
    .exec();

  if (!user) {
    return null;
  }

  // 4. Return the authenticated session.
  return admin;
}

// ======================================================
// DATE VALIDATION
// ======================================================

/**
 * Validate a YYYY-MM-DD calendar date.
 * Prevents invalid dates such as February 31.
 */
function isValidDateOnly(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * Parse promotion dates using Cambodia timezone (UTC+7).
 *
 * Date-only start:
 * 00:00:00.000 Cambodia time.
 *
 * Date-only end:
 * 23:59:59.999 Cambodia time.
 *
 * Full ISO timestamps preserve their exact timestamps.
 */
function parseOptionalDate(
  value: unknown,
  isEndDate = false,
): Date | null | undefined {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  // Handle date-only values.
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    if (!isValidDateOnly(normalized)) {
      return undefined;
    }

    const boundary = isEndDate ? "23:59:59.999" : "00:00:00.000";

    const date = new Date(`${normalized}T${boundary}+07:00`);

    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  // Handle full ISO timestamps.
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date;
}

// ======================================================
// PROMOTION VALIDATION
// ======================================================

function validatePromo(
  body: PromoInput,
):
  | { error: string; data?: never }
  | { error?: never; data: ValidatedPromoData } {
  const code =
    typeof body.code === "string" ? body.code.trim().toUpperCase() : "";

  const description =
    typeof body.description === "string" ? body.description.trim() : "";

  const discountType = body.discountType;

  const discountValue = Number(body.discountValue);

  const minimumOrder = Number(body.minimumOrder ?? 0);

  const usageLimit =
    body.usageLimit === "" ||
    body.usageLimit === null ||
    body.usageLimit === undefined
      ? null
      : Number(body.usageLimit);

  const startDate = parseOptionalDate(body.startDate, false);

  const endDate = parseOptionalDate(body.endDate, true);

  const isActive = body.isActive;

  // Promo code.
  if (!/^[A-Z0-9_-]{3,30}$/.test(code)) {
    return {
      error: "Promo code must be 3–30 characters (letters, numbers, _ or -).",
    };
  }

  // Description.
  if (!description || description.length > 200) {
    return {
      error: "Description is required and must be under 200 characters.",
    };
  }

  // Discount type.
  if (discountType !== "percentage" && discountType !== "fixed") {
    return {
      error: "Invalid discount type.",
    };
  }

  // Discount value.
  if (
    !Number.isFinite(discountValue) ||
    discountValue <= 0 ||
    (discountType === "percentage" && discountValue > 100)
  ) {
    return {
      error:
        discountType === "percentage"
          ? "Percentage discount must be greater than 0 and cannot exceed 100%."
          : "Fixed discount must be greater than zero.",
    };
  }

  // Minimum order.
  if (!Number.isFinite(minimumOrder) || minimumOrder < 0) {
    return {
      error: "Minimum order must be zero or greater.",
    };
  }

  // Usage limit.
  if (
    usageLimit !== null &&
    (!Number.isSafeInteger(usageLimit) || usageLimit < 1)
  ) {
    return {
      error: "Usage limit must be a positive whole number.",
    };
  }

  // Dates.
  if (startDate === undefined || endDate === undefined) {
    return {
      error: "Invalid promotion date.",
    };
  }

  if (startDate && endDate && startDate.getTime() > endDate.getTime()) {
    return {
      error: "End date must be on or after the start date.",
    };
  }

  // Active status.
  if (typeof isActive !== "boolean") {
    return {
      error: "Invalid active status.",
    };
  }

  return {
    data: {
      code,
      description,
      discountType,
      discountValue,
      minimumOrder,
      usageLimit,
      startDate,
      endDate,
      isActive,
    },
  };
}

// ======================================================
// ROUTE PARAMETER VALIDATION
// ======================================================

async function getValidPromoId(
  params: RouteContext["params"],
): Promise<string | null> {
  const { id } = await params;

  if (!mongoose.isValidObjectId(id)) {
    return null;
  }

  return id;
}

// ======================================================
// GET: RETRIEVE ONE PROMOTION
// ======================================================

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const admin = await getAdmin(request);

    if (!admin) {
      return errorResponse("Unauthorized. Please sign in again.", 401);
    }

    const id = await getValidPromoId(params);

    if (!id) {
      return errorResponse("Invalid promotion ID.", 400);
    }

    await connectDB();

    const promo = await Promo.findById(id).lean();

    if (!promo) {
      return errorResponse("Promotion not found.", 404);
    }

    return NextResponse.json(
      {
        success: true,
        promo,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("GET promo error:", error);

    return errorResponse("Unable to load promotion.", 500);
  }
}

// ======================================================
// PATCH: UPDATE PROMOTION
// ======================================================

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const admin = await getAdmin(request);

    if (!admin) {
      return errorResponse("Unauthorized. Please sign in again.", 401);
    }

    const id = await getValidPromoId(params);

    if (!id) {
      return errorResponse("Invalid promotion ID.", 400);
    }

    let body: PromoInput;

    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid request body.", 400);
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return errorResponse("Invalid promotion data.", 400);
    }

    const validation = validatePromo(body);

    if (validation.error !== undefined) {
      return errorResponse(validation.error, 400);
    }

    const data = validation.data;

    if (!data) {
      return errorResponse("Invalid promotion data.", 400);
    }

    await connectDB();

    // Check whether the promotion exists.
    const existingPromo = await Promo.findById(id);

    if (!existingPromo) {
      return errorResponse("Promotion not found.", 404);
    }

    // Prevent duplicate promotion codes.
    const duplicate = await Promo.findOne({
      code: data.code,
      _id: {
        $ne: id,
      },
    }).select("_id");

    if (duplicate) {
      return errorResponse("This promo code already exists.", 409);
    }

    /**
     * Update atomically.
     *
     * IMPORTANT:
     * - Do not include usedCount in $set.
     * - This prevents editing a promotion from overwriting
     *   usage increments made by successful orders.
     * - When changing usageLimit, the database checks that
     *   it is not lower than the current usedCount.
     */
    const updateFilter: Record<string, unknown> = {
      _id: id,
    };

    if (data.usageLimit !== null) {
      updateFilter.usedCount = {
        $lte: data.usageLimit,
      };
    }

    const updated = await Promo.findOneAndUpdate(
      updateFilter,
      {
        $set: {
          code: data.code,
          description: data.description,
          discountType: data.discountType,
          discountValue: data.discountValue,
          minimumOrder: data.minimumOrder,
          usageLimit: data.usageLimit,
          startDate: data.startDate,
          endDate: data.endDate,
          isActive: data.isActive,
        },
      },
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    if (!updated) {
      const latestPromo = await Promo.findById(id).select("usedCount").lean();

      if (!latestPromo) {
        return errorResponse("Promotion not found.", 404);
      }

      return errorResponse(
        `Usage limit cannot be less than ${latestPromo.usedCount} already used promotions.`,
        400,
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Promotion updated successfully.",
        promo: updated,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    ) {
      return errorResponse("This promo code already exists.", 409);
    }

    console.error("PATCH promo error:", error);

    return errorResponse("Unable to update promotion.", 500);
  }
}

// ======================================================
// DELETE: DELETE PROMOTION
// ======================================================

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const admin = await getAdmin(request);

    if (!admin) {
      return errorResponse("Unauthorized. Please sign in again.", 401);
    }

    const id = await getValidPromoId(params);

    if (!id) {
      return errorResponse("Invalid promotion ID.", 400);
    }

    await connectDB();

    const promo = await Promo.findById(id);

    if (!promo) {
      return errorResponse("Promotion not found.", 404);
    }

    /**
     * Preserve promotion history.
     *
     * Check both promoId and promoCode so older orders
     * without promoId are also protected.
     */
    const usedByOrders = await OnlineOrder.exists({
      $or: [
        {
          promoId: promo._id,
        },
        {
          promoCode: promo.code,
        },
      ],
    });

    if (usedByOrders) {
      return errorResponse(
        "This promotion has been used by existing orders. Deactivate it instead of deleting it.",
        409,
      );
    }

    await Promo.deleteOne({
      _id: promo._id,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Promotion deleted successfully.",
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("DELETE promo error:", error);

    return errorResponse("Unable to delete promotion.", 500);
  }
}
