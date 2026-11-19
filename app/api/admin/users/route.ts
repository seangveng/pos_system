import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import connectDB from "@/lib/mongodb";
import User from "@/models/User";

import { ADMIN_SESSION_COOKIE, getAdminSession } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UserRole = "OWNER" | "ADMIN" | "STAFF" | "CUSTOMER";
type AuthorizedRole = "OWNER" | "ADMIN" | "STAFF";

async function getAuthorizedUser(request: NextRequest) {
  try {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

    if (!token) return null;

    const session = getAdminSession(token);

    if (!session?.email || !session.role) {
      return null;
    }

    const email = session.email.toLowerCase().trim();

    // OWNER is authenticated by the signed session.
    // Do not require ADMIN_EMAIL from .env.local.
    if (session.role === "OWNER") {
      return {
        email,
        role: "OWNER" as const,
      };
    }

    // Only ADMIN and STAFF are allowed beyond this point.
    if (session.role !== "ADMIN" && session.role !== "STAFF") {
      return null;
    }

    // Verify ADMIN / STAFF against MongoDB.
    await connectDB();

    const user = await User.findOne({
      email,
      role: session.role,
      status: "ACTIVE",
    })
      .select("email role status")
      .lean();

    if (!user) {
      return null;
    }

    return {
      email,
      role: user.role as "ADMIN" | "STAFF",
    };
  } catch (error) {
    return null;
  }
}

// ==========================================
// GET: List and search users
//
// OWNER: Can view OWNER, ADMIN, STAFF, CUSTOMER.
// ADMIN: Can view CUSTOMER and STAFF only.
// STAFF: Cannot view users.
// ==========================================

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getAuthorizedUser(request);

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Please login again.",
        },
        { status: 401 },
      );
    }

    if (currentUser.role !== "OWNER" && currentUser.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have permission to view users.",
        },
        { status: 403 },
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";
    const requestedRole = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";

    const page = Math.max(
      1,
      Number.parseInt(searchParams.get("page") || "1", 10) || 1,
    );

    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(searchParams.get("limit") || "20", 10) || 20),
    );

    const filter: Record<string, unknown> = {};

    // Search by name or email.
    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        {
          name: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          email: {
            $regex: safeSearch,
            $options: "i",
          },
        },
      ];
    }

    // Filter by account status.
    if (status && ["ACTIVE", "INACTIVE", "SUSPENDED"].includes(status)) {
      filter.status = status;
    }

    // Role visibility restrictions.
    if (currentUser.role === "ADMIN") {
      // ADMIN can only see CUSTOMER and STAFF.
      filter.role = {
        $in: ["CUSTOMER", "STAFF"],
      };

      if (requestedRole && !["CUSTOMER", "STAFF"].includes(requestedRole)) {
        return NextResponse.json(
          {
            success: false,
            message: "You cannot view this user role.",
          },
          { status: 403 },
        );
      }

      if (requestedRole) {
        filter.role = requestedRole;
      }
    } else {
      // OWNER can see all user roles except environment-only accounts
      // that do not exist in MongoDB.
      if (
        requestedRole &&
        !["OWNER", "ADMIN", "STAFF", "CUSTOMER"].includes(requestedRole)
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid role filter.",
          },
          { status: 400 },
        );
      }

      if (requestedRole) {
        filter.role = requestedRole;
      } else {
        filter.role = {
          $in: ["OWNER", "ADMIN", "STAFF", "CUSTOMER"],
        };
      }
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("name email phone role status createdAt updatedAt")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      User.countDocuments(filter),
    ]);

    return NextResponse.json(
      {
        success: true,
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve users.",
      },
      { status: 500 },
    );
  }
}

// ==========================================
// POST: Create user accounts
//
// OWNER: Can create OWNER, ADMIN, STAFF.
// ADMIN: Can create STAFF only.
// STAFF: Cannot create accounts.
// ==========================================

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getAuthorizedUser(request);

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Please login again.",
        },
        { status: 401 },
      );
    }

    // Only OWNER and ADMIN can create accounts.
    if (currentUser.role !== "OWNER" && currentUser.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have permission to create accounts.",
        },
        { status: 403 },
      );
    }

    const body: unknown = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body.",
        },
        { status: 400 },
      );
    }

    const input = body as Record<string, unknown>;

    const name = typeof input.name === "string" ? input.name.trim() : "";

    const email =
      typeof input.email === "string" ? input.email.trim().toLowerCase() : "";

    const password = typeof input.password === "string" ? input.password : "";

    const phone = typeof input.phone === "string" ? input.phone.trim() : "";

    const role = typeof input.role === "string" ? input.role : "";

    // Validate required fields.
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, email, password and role are required.",
        },
        { status: 400 },
      );
    }

    // Validate email.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid email address.",
        },
        { status: 400 },
      );
    }

    // Validate name and email lengths.
    if (name.length > 100 || email.length > 254) {
      return NextResponse.json(
        {
          success: false,
          message: "Name or email is too long.",
        },
        { status: 400 },
      );
    }

    // Validate phone.
    if (phone.length > 30) {
      return NextResponse.json(
        {
          success: false,
          message: "Phone number must not exceed 30 characters.",
        },
        { status: 400 },
      );
    }

    // Validate password.
    if (password.length < 8 || password.length > 72) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be between 8 and 72 characters.",
        },
        { status: 400 },
      );
    }

    // Validate allowed roles based on authenticated user.
    const allowedRoles: UserRole[] =
      currentUser.role === "OWNER" ? ["OWNER", "ADMIN", "STAFF"] : ["STAFF"];

    if (!allowedRoles.includes(role as UserRole)) {
      return NextResponse.json(
        {
          success: false,
          message:
            currentUser.role === "ADMIN"
              ? "ADMIN can only create STAFF accounts."
              : "Invalid account role.",
        },
        { status: 403 },
      );
    }

    await connectDB();

    // Prevent duplicate email accounts.
    const existingUser = await User.findOne({
      email,
    }).select("_id");

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "An account with this email already exists.",
        },
        { status: 409 },
      );
    }

    // Hash password before saving.
    const passwordHash = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      name,
      email,
      passwordHash,
      phone: phone || undefined,
      role: role as UserRole,
      status: "ACTIVE",
    });

    return NextResponse.json(
      {
        success: true,
        message: `${newUser.role} account created successfully.`,
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone ?? "",
          role: newUser.role,
          status: newUser.status,
          createdAt: newUser.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "This email is already registered.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create user account.",
      },
      { status: 500 },
    );
  }
}
