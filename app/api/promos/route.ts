import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import Promo from "@/models/Promo";
import User from "@/models/User";

import {
  ADMIN_SESSION_COOKIE,
  getAdminSession,
  type AdminSession,
} from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["OWNER", "ADMIN", "STAFF"] as const;

type AdminRole = (typeof ALLOWED_ROLES)[number];

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

type PromoData = {
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

type PromoValidationResult =
  | { error: string; data?: never }
  | { error?: never; data: PromoData };

// ======================================================
// DATABASE ERROR
// ======================================================

class DatabaseUnavailableError extends Error {
  constructor() {
    super("Database unavailable.");
    this.name = "DatabaseUnavailableError";
  }
}

function isDatabaseUnavailable(error: unknown): boolean {
  if (error instanceof DatabaseUnavailableError) {
    return true;
  }

  if (!error || typeof error !== "object") {
    return false;
  }

  const err = error as {
    name?: string;
    message?: string;
    cause?: unknown;
  };

  const databaseErrorNames = [
    "MongooseServerSelectionError",
    "MongoServerSelectionError",
    "MongoNetworkError",
    "MongoNetworkTimeoutError",
    "PoolClearedOnNetworkError",
    "MongoWaitQueueTimeoutError",
    "MongoTimeoutError",
  ];

  if (err.name && databaseErrorNames.includes(err.name)) {
    return true;
  }

  if (
    err.message &&
    /server selection timed out|connection timed out|connection.*interrupted|network error|topology was destroyed/i.test(
      err.message,
    )
  ) {
    return true;
  }

  return err.cause ? isDatabaseUnavailable(err.cause) : false;
}

// ======================================================
// RESPONSE HELPERS
// ======================================================

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
    },
  });
}

function unauthorizedResponse() {
  return jsonResponse(
    {
      success: false,
      code: "UNAUTHORIZED",
      error: "Unauthorized. Please sign in again.",
    },
    401,
  );
}

function databaseUnavailableResponse() {
  return jsonResponse(
    {
      success: false,
      code: "DATABASE_UNAVAILABLE",
      error: "Database unavailable. Please try again.",
    },
    503,
  );
}

// ======================================================
// AUTHENTICATION - MONGODB ONLY
// ======================================================

async function getAdmin(request: NextRequest): Promise<AdminSession | null> {
  // 1. Read session cookie.
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

  if (!token) {
    console.warn("[PROMOS AUTH] Session cookie is missing.");
    return null;
  }

  // 2. Verify signed session.
  const admin = getAdminSession(token);

  if (!admin) {
    console.warn("[PROMOS AUTH] Session is invalid or expired.");
    return null;
  }

  // 3. Verify session role.
  if (!ALLOWED_ROLES.includes(admin.role as AdminRole)) {
    console.warn("[PROMOS AUTH] Unauthorized role.");
    return null;
  }

  const email = admin.email.trim().toLowerCase();

  // 4. Connect to MongoDB for ALL roles, including OWNER.
  try {
    await connectDB();

    // 5. Find account in MongoDB.
    const user = await User.findOne({ email })
      .select("email role status")
      .lean()
      .exec();

    if (!user) {
      console.warn("[PROMOS AUTH] User not found.");
      return null;
    }

    // 6. Verify account status.
    if (user.status !== "ACTIVE") {
      console.warn("[PROMOS AUTH] Account is not active.");
      return null;
    }

    // 7. Verify database role matches session role.
    if (user.role !== admin.role) {
      console.warn("[PROMOS AUTH] Database role mismatch.");
      return null;
    }

    if (!ALLOWED_ROLES.includes(user.role as AdminRole)) {
      console.warn("[PROMOS AUTH] Database role is not allowed.");
      return null;
    }

    return admin;
  } catch (error) {
    console.error("[PROMOS AUTH] Database verification failed:", error);

    throw new DatabaseUnavailableError();
  }
}

// ======================================================
// DATE VALIDATION
// ======================================================

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

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return null;
  }

  // Date-only values use Cambodia UTC+7.
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
    if (!isValidDateOnly(normalizedValue)) {
      return undefined;
    }

    const time = isEndDate ? "23:59:59.999" : "00:00:00.000";

    const date = new Date(`${normalizedValue}T${time}+07:00`);

    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  // Full timestamps preserve their exact instant.
  const date = new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date;
}

// ======================================================
// PROMOTION VALIDATION
// ======================================================

function validatePromo(body: PromoInput): PromoValidationResult {
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

  const isActive = body.isActive ?? true;

  if (!/^[A-Z0-9_-]{3,30}$/.test(code)) {
    return {
      error: "Promo code must be 3–30 characters (letters, numbers, _ or -).",
    };
  }

  if (!description || description.length > 200) {
    return {
      error: "Description is required and must be under 200 characters.",
    };
  }

  if (discountType !== "percentage" && discountType !== "fixed") {
    return {
      error: "Invalid discount type.",
    };
  }

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

  if (!Number.isFinite(minimumOrder) || minimumOrder < 0) {
    return {
      error: "Minimum order must be zero or greater.",
    };
  }

  if (
    usageLimit !== null &&
    (!Number.isSafeInteger(usageLimit) || usageLimit < 1)
  ) {
    return {
      error: "Usage limit must be a positive whole number.",
    };
  }

  if (startDate === undefined || endDate === undefined) {
    return {
      error: "Invalid promotion date.",
    };
  }

  if (startDate && endDate && startDate.getTime() > endDate.getTime()) {
    return {
      error: "End date must be after start date.",
    };
  }

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
// GET: RETRIEVE ALL PROMOTIONS
// ======================================================

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdmin(request);

    if (!admin) {
      return unauthorizedResponse();
    }

    await connectDB();

    const promos = await Promo.find({}).sort({ createdAt: -1 }).lean().exec();

    return jsonResponse({
      success: true,
      promos,
    });
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      console.error("[GET PROMOS] Database unavailable:", error);
      return databaseUnavailableResponse();
    }

    console.error("[GET PROMOS ERROR]", error);

    return jsonResponse(
      {
        success: false,
        error: "Unable to load promotions.",
      },
      500,
    );
  }
}

// ======================================================
// POST: CREATE A PROMOTION
// ======================================================

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdmin(request);

    if (!admin) {
      return unauthorizedResponse();
    }

    // Parse request body.
    let body: PromoInput;

    try {
      const parsedBody: unknown = await request.json();

      if (
        !parsedBody ||
        typeof parsedBody !== "object" ||
        Array.isArray(parsedBody)
      ) {
        return jsonResponse(
          {
            success: false,
            error: "Invalid promotion data.",
          },
          400,
        );
      }

      body = parsedBody as PromoInput;
    } catch {
      return jsonResponse(
        {
          success: false,
          error: "Invalid request body.",
        },
        400,
      );
    }

    // Validate promotion.
    const validation = validatePromo(body);

    if (validation.error !== undefined) {
      return jsonResponse(
        {
          success: false,
          error: validation.error,
        },
        400,
      );
    }

    // Explicitly narrow validated data.
    const data = validation.data;

    if (!data) {
      return jsonResponse(
        {
          success: false,
          error: "Invalid promotion data.",
        },
        400,
      );
    }

    // Check duplicate code.
    const existingPromo = await Promo.findOne({
      code: data.code,
    })
      .select("_id")
      .lean()
      .exec();

    if (existingPromo) {
      return jsonResponse(
        {
          success: false,
          error: "This promo code already exists.",
        },
        409,
      );
    }

    // Create promotion.
    const promo = await Promo.create(data);

    return jsonResponse(
      {
        success: true,
        message: "Promotion created successfully.",
        promo,
      },
      201,
    );
  } catch (error: unknown) {
    if (isDatabaseUnavailable(error)) {
      console.error("[POST PROMOS] Database unavailable:", error);
      return databaseUnavailableResponse();
    }

    // MongoDB duplicate key.
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    ) {
      return jsonResponse(
        {
          success: false,
          error: "This promo code already exists.",
        },
        409,
      );
    }

    console.error("[POST PROMOS ERROR]", error);

    return jsonResponse(
      {
        success: false,
        error: "Unable to create promotion.",
      },
      500,
    );
  }
}
