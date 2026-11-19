import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import StoreSettings from "@/models/StoreSettings";
import User from "@/models/User";

import { ADMIN_SESSION_COOKIE, getAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AuthorizedRole = "OWNER" | "ADMIN" | "STAFF";

type AuthorizedContext = {
  role: AuthorizedRole;
  email: string;
  user: {
    name?: string;
    email?: string;
    phone?: string;
  } | null;
};

const ALLOWED_READ_ROLES: AuthorizedRole[] = ["OWNER", "ADMIN", "STAFF"];

const ALLOWED_STORE_FIELDS = [
  "storeName",
  "logo",
  "phone",
  "email",
  "address",
  "currency",
  "taxEnabled",
  "taxRate",
  "receiptFooter",
  "showLogoOnReceipt",
  "allowOnlineOrders",
  "allowCashPayments",
  "allowOnlinePayments",
] as const;

const MAX_LOGO_LENGTH = 700_000;

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}

/* =========================================================
   AUTHORIZATION
========================================================= */

async function getAuthorizedContext(
  request: NextRequest,
): Promise<AuthorizedContext | null> {
  try {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

    if (!token) {
      return null;
    }

    const session = await getAdminSession(token);

    if (!session?.email || !session?.role) {
      return null;
    }

    // Validate role.
    const allowedRoles: AuthorizedRole[] = ["OWNER", "ADMIN", "STAFF"];

    if (!allowedRoles.includes(session.role as AuthorizedRole)) {
      return null;
    }

    const role = session.role as AuthorizedRole;
    const email = session.email.trim().toLowerCase();

    // All roles, including OWNER, must exist and be ACTIVE in MongoDB.
    await connectDB();

    const user = await User.findOne({
      email,
      role,
      status: "ACTIVE",
    })
      .select("name email phone role status")
      .lean()
      .exec();

    if (!user) {
      console.error("[SETTINGS AUTH] Active MongoDB user not found:", {
        email,
        role,
      });

      return null;
    }

    return {
      role,
      email: user.email,
      user: {
        name: user.name ?? "",
        email: user.email,
        phone: user.phone ?? "",
      },
    };
  } catch (error) {
    console.error("[SETTINGS AUTH] Authorization error:", error);
    return null;
  }
}

/* =========================================================
   LOGO VALIDATION
========================================================= */

function validateLogo(value: unknown): string | null {
  if (typeof value !== "string") {
    return "Invalid logo format.";
  }

  if (value.length > MAX_LOGO_LENGTH) {
    return "Logo is too large. Maximum size is 500KB.";
  }

  if (!value.trim()) {
    return null;
  }

  // Allow compressed WebP data URLs.
  if (value.startsWith("data:image/webp;base64,")) {
    try {
      const base64 = value.split(",")[1];

      if (!base64) {
        return "Invalid WebP image.";
      }

      const binary = Buffer.from(base64, "base64");

      if (
        binary.length < 12 ||
        binary.toString("ascii", 0, 4) !== "RIFF" ||
        binary.toString("ascii", 8, 12) !== "WEBP"
      ) {
        return "Invalid WebP image.";
      }

      return null;
    } catch {
      return "Invalid WebP image.";
    }
  }

  // Allow normal HTTP/HTTPS image URLs.
  if (value.length > 2048) {
    return "Logo URL is too long.";
  }

  try {
    const url = new URL(value);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "Logo must use HTTP or HTTPS.";
    }

    return null;
  } catch {
    return "Invalid logo URL.";
  }
}

/* =========================================================
   STORE SETTINGS VALIDATION
========================================================= */

function validateStoreSettings(body: Record<string, unknown>): string | null {
  if (
    body.storeName !== undefined &&
    (typeof body.storeName !== "string" ||
      body.storeName.trim().length === 0 ||
      body.storeName.length > 100)
  ) {
    return "Store name is required and must not exceed 100 characters.";
  }

  if (body.logo !== undefined) {
    const logoError = validateLogo(body.logo);

    if (logoError) {
      return logoError;
    }
  }

  if (
    body.phone !== undefined &&
    (typeof body.phone !== "string" || body.phone.length > 50)
  ) {
    return "Invalid phone number.";
  }

  if (body.email !== undefined && typeof body.email !== "string") {
    return "Invalid email address.";
  }

  if (
    typeof body.email === "string" &&
    body.email.trim() !== "" &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)
  ) {
    return "Invalid email address.";
  }

  if (
    body.address !== undefined &&
    (typeof body.address !== "string" || body.address.length > 500)
  ) {
    return "Address must not exceed 500 characters.";
  }

  if (
    body.currency !== undefined &&
    body.currency !== "USD" &&
    body.currency !== "KHR"
  ) {
    return "Invalid currency.";
  }

  if (body.taxEnabled !== undefined && typeof body.taxEnabled !== "boolean") {
    return "Invalid tax setting.";
  }

  if (
    body.taxRate !== undefined &&
    (typeof body.taxRate !== "number" ||
      !Number.isFinite(body.taxRate) ||
      body.taxRate < 0 ||
      body.taxRate > 100)
  ) {
    return "Tax rate must be between 0 and 100.";
  }

  if (
    body.receiptFooter !== undefined &&
    (typeof body.receiptFooter !== "string" || body.receiptFooter.length > 500)
  ) {
    return "Receipt footer must not exceed 500 characters.";
  }

  const booleanFields = [
    "showLogoOnReceipt",
    "allowOnlineOrders",
    "allowCashPayments",
    "allowOnlinePayments",
  ] as const;

  for (const field of booleanFields) {
    if (body[field] !== undefined && typeof body[field] !== "boolean") {
      return `Invalid ${field} setting.`;
    }
  }

  return null;
}

/* =========================================================
   ACCOUNT SETTINGS VALIDATION
========================================================= */

function validateAccountSettings(body: Record<string, unknown>): string | null {
  if (
    body.name !== undefined &&
    (typeof body.name !== "string" ||
      body.name.trim().length === 0 ||
      body.name.length > 100)
  ) {
    return "Name is required and must not exceed 100 characters.";
  }

  if (
    body.phone !== undefined &&
    (typeof body.phone !== "string" || body.phone.length > 50)
  ) {
    return "Invalid phone number.";
  }

  return null;
}

/* =========================================================
   GET /api/admin/settings
========================================================= */

export async function GET(request: NextRequest) {
  try {
    const context = await getAuthorizedContext(request);

    if (!context || !ALLOWED_READ_ROLES.includes(context.role)) {
      return jsonResponse(
        {
          success: false,
          message: "Unauthorized access.",
        },
        403,
      );
    }

    // Ensure MongoDB is connected for OWNER sessions too.
    await connectDB();

    // Read settings without performing a database write.
    let settings: any = await StoreSettings.findOne({}).lean();

    // Create default settings only when no document exists.
    if (!settings) {
      try {
        const createdSettings = await StoreSettings.create({});
        settings = createdSettings.toObject();
      } catch (error) {
        // Handle a possible simultaneous first-time creation.
        settings = await StoreSettings.findOne({}).lean();

        if (!settings) {
          throw error;
        }
      }
    }

    // STAFF can read ONLY the company name and logo.
    if (context.role === "STAFF") {
      return jsonResponse({
        success: true,
        settings: {
          storeName: settings?.storeName ?? "Happy Birds",
          logo: settings?.logo ?? "",
        },
        role: "STAFF",
      });
    }

    // OWNER and ADMIN retain their existing read access.
    return jsonResponse({
      success: true,
      settings,
      account: context.user
        ? {
            name: context.user.name ?? "",
            email: context.user.email ?? context.email,
            phone: context.user.phone ?? "",
            role: context.role,
          }
        : {
            name: "Owner",
            email: context.email,
            phone: "",
            role: context.role,
          },
      role: context.role,
    });
  } catch (error) {
    console.error("GET SETTINGS ERROR:", error);

    return jsonResponse(
      {
        success: false,
        message: "Failed to load store settings.",
      },
      500,
    );
  }
}

/* =========================================================
   PUT /api/admin/settings
========================================================= */

export async function PUT(request: NextRequest) {
  try {
    const context = await getAuthorizedContext(request);

    if (!context || context.role === "STAFF") {
      return jsonResponse(
        {
          success: false,
          message: "You are not authorized to update settings.",
        },
        403,
      );
    }

    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return jsonResponse(
        {
          success: false,
          message: "Invalid request body.",
        },
        400,
      );
    }

    const updateData: Record<string, unknown> = {};

    // ADMIN can update ONLY the store logo.
    if (context.role === "ADMIN") {
      if (body.logo === undefined) {
        return jsonResponse(
          {
            success: false,
            message: "ADMIN can only update the store logo.",
          },
          403,
        );
      }

      const logoError = validateLogo(body.logo);

      if (logoError) {
        return jsonResponse(
          {
            success: false,
            message: logoError,
          },
          400,
        );
      }

      updateData.logo = body.logo;
    }

    // OWNER can update all allowed store settings.
    if (context.role === "OWNER") {
      const validationError = validateStoreSettings(body);

      if (validationError) {
        return jsonResponse(
          {
            success: false,
            message: validationError,
          },
          400,
        );
      }

      for (const field of ALLOWED_STORE_FIELDS) {
        if (body[field] !== undefined) {
          updateData[field] = body[field];
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return jsonResponse(
        {
          success: false,
          message: "No valid settings provided.",
        },
        400,
      );
    }

    await connectDB();

    const settings = await StoreSettings.findOneAndUpdate(
      {},
      {
        $set: updateData,
      },
      {
        returnDocument: "after",
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    ).lean();

    return jsonResponse({
      success: true,
      message: "Store settings updated successfully.",
      settings,
    });
  } catch (error) {
    console.error("PUT SETTINGS ERROR:", error);

    return jsonResponse(
      {
        success: false,
        message: "Failed to update store settings.",
      },
      500,
    );
  }
}

/* =========================================================
   PATCH /api/admin/settings
========================================================= */

export async function PATCH(request: NextRequest) {
  try {
    const context = await getAuthorizedContext(request);

    if (!context || context.role === "STAFF") {
      return jsonResponse(
        {
          success: false,
          message: "You are not authorized to update this account.",
        },
        403,
      );
    }

    if (context.role === "OWNER") {
      return jsonResponse(
        {
          success: false,
          message: "Owner profile is managed through the signed session.",
        },
        403,
      );
    }

    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return jsonResponse(
        {
          success: false,
          message: "Invalid request body.",
        },
        400,
      );
    }

    const validationError = validateAccountSettings(body);

    if (validationError) {
      return jsonResponse(
        {
          success: false,
          message: validationError,
        },
        400,
      );
    }

    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) {
      updateData.name = body.name.trim();
    }

    if (body.phone !== undefined) {
      updateData.phone = body.phone.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return jsonResponse(
        {
          success: false,
          message: "No account changes provided.",
        },
        400,
      );
    }

    await connectDB();

    const user = await User.findOneAndUpdate(
      {
        email: context.email,
        role: "ADMIN",
        status: "ACTIVE",
      },
      {
        $set: updateData,
      },
      {
        returnDocument: "after",
        runValidators: true,
      },
    )
      .select("name email phone role status")
      .lean();

    if (!user) {
      return jsonResponse(
        {
          success: false,
          message: "Admin account not found or inactive.",
        },
        404,
      );
    }

    return jsonResponse({
      success: true,
      message: "Account settings updated successfully.",
      account: {
        name: user.name ?? "",
        email: user.email,
        phone: user.phone ?? "",
        role: user.role,
      },
    });
  } catch (error) {
    console.error("PATCH SETTINGS ERROR:", error);

    return jsonResponse(
      {
        success: false,
        message: "Failed to update account settings.",
      },
      500,
    );
  }
}
