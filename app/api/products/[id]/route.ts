import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import User from "@/models/User";
import { ADMIN_SESSION_COOKIE, getAdminSession } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function authorize(request: NextRequest): Promise<boolean> {
  try {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

    if (!token) return false;

    const session = await getAdminSession(token);

    if (!session) return false;

    const role = String(session.role || "").toUpperCase();

    // OWNER authentication uses the configured admin email.
    if (role === "OWNER") {
      return (
        String(session.email || "").toLowerCase() ===
        String(process.env.ADMIN_EMAIL || "").toLowerCase()
      );
    }

    // Only ADMIN and STAFF can continue to database validation.
    if (role !== "ADMIN" && role !== "STAFF") {
      return false;
    }

    await connectDB();

    // AdminSession contains email, not userId.
    const user = await User.findOne({
      email: String(session.email || "").toLowerCase(),
    })
      .select("role status email")
      .lean();

    if (!user || String(user.status).toUpperCase() !== "ACTIVE") {
      return false;
    }

    return String(user.role).toUpperCase() === role;
  } catch (error) {
    console.error("Product authorization error:", error);
    return false;
  }
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

function validProductId(id: string): boolean {
  return /^\d+$/.test(id) && Number(id) > 0;
}

/**
 * GET /api/products/[id]
 * Get one active product.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!validProductId(id)) {
      return errorResponse("Invalid product ID.", 400);
    }

    await connectDB();

    const product = await Product.findOne({
      id: Number(id),
      status: "active",
    }).lean();

    if (!product) {
      return errorResponse("Product not found.", 404);
    }

    return NextResponse.json(
      { success: true, product },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    console.error("Get product error:", error);
    return errorResponse("Unable to load product.", 500);
  }
}

/**
 * PATCH /api/products/[id]
 * Update a product.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    if (!(await authorize(request))) {
      return errorResponse("Unauthorized.", 401);
    }

    const { id } = await context.params;

    if (!validProductId(id)) {
      return errorResponse("Invalid product ID.", 400);
    }

    await connectDB();

    const body = await request.json();

    const allowedFields = [
      "name",
      "sku",
      "category",
      "price",
      "stock",
      "trackStock",
      "image",
      "description",
      "status",
      "sizes",
      "colors",
      "rating",
    ] as const;

    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return errorResponse("No valid fields provided.", 400);
    }

    if (
      updates.name !== undefined &&
      (typeof updates.name !== "string" || !updates.name.trim())
    ) {
      return errorResponse("Product name is required.", 400);
    }

    if (
      updates.sku !== undefined &&
      (typeof updates.sku !== "string" || !updates.sku.trim())
    ) {
      return errorResponse("Valid SKU is required.", 400);
    }

    if (
      updates.category !== undefined &&
      (typeof updates.category !== "string" || !updates.category.trim())
    ) {
      return errorResponse("Product category is required.", 400);
    }

    for (const field of ["price", "stock", "rating"] as const) {
      const value = updates[field];

      if (value !== undefined) {
        if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
          return errorResponse(`Invalid ${field}.`, 400);
        }
      }
    }

    if (
      updates.trackStock !== undefined &&
      typeof updates.trackStock !== "boolean"
    ) {
      return errorResponse("Invalid trackStock value.", 400);
    }

    if (
      updates.status !== undefined &&
      !["active", "inactive"].includes(String(updates.status))
    ) {
      return errorResponse("Invalid product status.", 400);
    }

    for (const field of ["sizes", "colors"] as const) {
      if (
        updates[field] !== undefined &&
        (!Array.isArray(updates[field]) ||
          !updates[field].every((value) => typeof value === "string"))
      ) {
        return errorResponse(`Invalid ${field}.`, 400);
      }
    }

    if (updates.name !== undefined) {
      updates.name = (updates.name as string).trim();
    }

    if (updates.sku !== undefined) {
      updates.sku = (updates.sku as string).trim().toUpperCase();
    }

    if (updates.category !== undefined) {
      updates.category = (updates.category as string).trim();
    }

    if (updates.description !== undefined) {
      if (typeof updates.description !== "string") {
        return errorResponse("Invalid description.", 400);
      }

      updates.description = updates.description.trim();
    }

    const product = await Product.findOneAndUpdate(
      { id: Number(id) },
      { $set: updates },
      {
        returnDocument: "after",
        runValidators: true,
      },
    ).lean();

    if (!product) {
      return errorResponse("Product not found.", 404);
    }

    return NextResponse.json({
      success: true,
      message: "Product updated successfully.",
      product,
    });
  } catch (error: unknown) {
    console.error("Update product error:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return errorResponse("SKU already exists.", 409);
    }

    return errorResponse("Unable to update product.", 500);
  }
}

/**
 * DELETE /api/products/[id]
 * Permanently delete a product.
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    if (!(await authorize(request))) {
      return errorResponse("Unauthorized.", 401);
    }

    const { id } = await context.params;

    if (!validProductId(id)) {
      return errorResponse("Invalid product ID.", 400);
    }

    await connectDB();

    const product = await Product.findOneAndDelete({
      id: Number(id),
    });

    if (!product) {
      return errorResponse("Product not found.", 404);
    }

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully.",
      productId: Number(id),
    });
  } catch (error) {
    console.error("Delete product error:", error);
    return errorResponse("Unable to delete product.", 500);
  }
}
