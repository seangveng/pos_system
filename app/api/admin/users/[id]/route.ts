import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { ADMIN_SESSION_COOKIE, getAdminSession } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function authorizeOwner(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const session = getAdminSession(token);

  if (!session || session.role !== "OWNER") {
    return false;
  }

  const ownerEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();

  return Boolean(
    ownerEmail && session.email.toLowerCase().trim() === ownerEmail,
  );
}

// PUT: Update user
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const authorized = await authorizeOwner(request);

    if (!authorized) {
      return NextResponse.json(
        { success: false, message: "Only OWNER can update users." },
        { status: 403 },
      );
    }

    await connectDB();

    const { id } = await context.params;

    const body = await request.json();

    if (!/^[a-f\d]{24}$/i.test(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid user ID." },
        { status: 400 },
      );
    }

    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 },
      );
    }

    // Never allow this API to manage OWNER accounts.
    if (user.role === "OWNER") {
      return NextResponse.json(
        { success: false, message: "OWNER accounts cannot be modified here." },
        { status: 403 },
      );
    }

    const updates: Record<string, string> = {};

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || !body.name.trim()) {
        return NextResponse.json(
          { success: false, message: "Invalid name." },
          { status: 400 },
        );
      }

      updates.name = body.name.trim();
    }

    if (body.email !== undefined) {
      if (
        typeof body.email !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())
      ) {
        return NextResponse.json(
          { success: false, message: "Invalid email address." },
          { status: 400 },
        );
      }

      updates.email = body.email.trim().toLowerCase();
    }

    if (body.phone !== undefined) {
      if (typeof body.phone !== "string") {
        return NextResponse.json(
          { success: false, message: "Invalid phone number." },
          { status: 400 },
        );
      }

      updates.phone = body.phone.trim();
    }

    if (body.role !== undefined) {
      if (!["STAFF", "ADMIN"].includes(body.role)) {
        return NextResponse.json(
          {
            success: false,
            message: "Only STAFF and ADMIN roles are allowed.",
          },
          { status: 400 },
        );
      }

      updates.role = body.role;
    }

    if (body.status !== undefined) {
      if (!["ACTIVE", "INACTIVE", "SUSPENDED"].includes(body.status)) {
        return NextResponse.json(
          { success: false, message: "Invalid account status." },
          { status: 400 },
        );
      }

      updates.status = body.status;
    }

    Object.assign(user, updates);

    await user.save();

    return NextResponse.json({
      success: true,
      message: "User updated successfully.",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json(
        { success: false, message: "Email is already registered." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { success: false, message: "Unable to update user." },
      { status: 500 },
    );
  }
}

// DELETE: Delete user
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const authorized = await authorizeOwner(request);

    if (!authorized) {
      return NextResponse.json(
        { success: false, message: "Only OWNER can delete users." },
        { status: 403 },
      );
    }

    await connectDB();

    const { id } = await context.params;

    if (!/^[a-f\d]{24}$/i.test(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid user ID." },
        { status: 400 },
      );
    }

    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 },
      );
    }

    if (user.role === "OWNER") {
      return NextResponse.json(
        { success: false, message: "OWNER accounts cannot be deleted." },
        { status: 403 },
      );
    }

    await User.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "User deleted successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Unable to delete user." },
      { status: 500 },
    );
  }
}
