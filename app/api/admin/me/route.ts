import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import User from "@/models/User";

import { ADMIN_SESSION_COOKIE, getAdminSession } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["STAFF", "ADMIN", "OWNER"] as const;

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    // ======================================================
    // 1. VERIFY SESSION COOKIE
    // ======================================================

    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const session = getAdminSession(token);

    if (
      !session ||
      !ALLOWED_ROLES.includes(session.role as (typeof ALLOWED_ROLES)[number])
    ) {
      return jsonResponse(
        {
          success: false,
          code: "UNAUTHORIZED",
          message: "Unauthorized. Please login again.",
        },
        401,
      );
    }

    const email = session.email.trim().toLowerCase();

    // ======================================================
    // 2. CONNECT TO MONGODB
    // ======================================================

    try {
      await connectDB();
    } catch (dbError) {
      return jsonResponse(
        {
          success: false,
          code: "DATABASE_UNAVAILABLE",
          message: "Database unavailable. Please try again.",
        },
        503,
      );
    }

    // ======================================================
    // 3. FIND USER IN MONGODB
    // ======================================================

    const user = await User.findOne({ email })
      .select("name email role status")
      .lean();

    if (!user) {
      return jsonResponse(
        {
          success: false,
          code: "ACCOUNT_NOT_FOUND",
          message: "Account not found. Please login again.",
        },
        401,
      );
    }

    // ======================================================
    // 4. CHECK ACCOUNT STATUS
    // ======================================================

    if (user.status !== "ACTIVE") {
      return jsonResponse(
        {
          success: false,
          code: "ACCOUNT_INACTIVE",
          message: "Your account is inactive or suspended.",
        },
        403,
      );
    }

    // ======================================================
    // 5. VERIFY ROLE
    // ======================================================

    if (
      !ALLOWED_ROLES.includes(user.role as (typeof ALLOWED_ROLES)[number]) ||
      user.role !== session.role
    ) {
      return jsonResponse(
        {
          success: false,
          code: "ROLE_CHANGED",
          message: "Your permissions have changed. Please login again.",
        },
        403,
      );
    }

    // ======================================================
    // 6. RETURN AUTHENTICATED USER
    // ======================================================

    return jsonResponse({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        code: "SESSION_VERIFICATION_FAILED",
        message: "Unable to verify your session.",
      },
      500,
    );
  }
}
