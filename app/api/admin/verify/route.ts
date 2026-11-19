import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import connectDB from "@/lib/mongodb";
import User from "@/models/User";

import {
  createAdminSession,
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE,
} from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AdminRole = "OWNER" | "ADMIN" | "STAFF";

const ALLOWED_ROLES: AdminRole[] = ["OWNER", "ADMIN", "STAFF"];

function createLoginResponse(email: string, role: AdminRole) {
  const normalizedEmail = email.trim().toLowerCase();
  const token = createAdminSession(normalizedEmail, role);

  const response = NextResponse.json(
    {
      success: true,
      message: "Login successful.",
      user: {
        email: normalizedEmail,
        role,
      },
      redirectTo: role === "STAFF" ? "/admin/orders" : "/admin/overview",
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );

  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });

  return response;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and password are required.",
        },
        { status: 400 },
      );
    }

    // ======================================================
    // 1. CONNECT TO MONGODB
    // ======================================================

    try {
      await connectDB();
    } catch (dbError) {
      return NextResponse.json(
        {
          success: false,
          code: "DATABASE_UNAVAILABLE",
          message:
            "Cannot connect to the database. Check your MongoDB connection and try again.",
        },
        {
          status: 503,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    // ======================================================
    // 2. FIND USER IN MONGODB
    // ======================================================

    const user = await User.findOne({ email }).select("+passwordHash").lean();

    if (
      !user ||
      typeof user.passwordHash !== "string" ||
      !ALLOWED_ROLES.includes(user.role as AdminRole) ||
      user.status !== "ACTIVE"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password.",
        },
        {
          status: 401,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    // ======================================================
    // 3. VERIFY PASSWORD
    // ======================================================

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password.",
        },
        {
          status: 401,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    // ======================================================
    // 4. CREATE ADMIN SESSION
    // ======================================================

    return createLoginResponse(user.email, user.role as AdminRole);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Unable to process login request.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
