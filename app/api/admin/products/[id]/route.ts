import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";

import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function isAdmin(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

  if (!token) return false;

  try {
    return Boolean(await verifyAdminSession(token));
  } catch {
    return false;
  }
}

async function getProductId(context: RouteContext) {
  const { id: rawId } = await context.params;
  const id = Number(rawId);

  if (!Number.isSafeInteger(id) || id < 1) {
    return null;
  }

  return id;
}

// PATCH: Update product
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in again." },
        { status: 401 },
      );
    }

    const id = await getProductId(context);

    if (id === null) {
      return NextResponse.json(
        { error: "Invalid product ID." },
        { status: 400 },
      );
    }

    await connectDB();

    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const sku = String(body.sku ?? "")
      .trim()
      .toUpperCase();
    const category = String(body.category ?? "").trim();

    const price = Number(body.price);
    const stock = Number(body.stock ?? 0);

    if (!name || !sku || !category) {
      return NextResponse.json(
        { error: "Name, SKU, and category are required." },
        { status: 400 },
      );
    }

    if (
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isFinite(stock) ||
      stock < 0
    ) {
      return NextResponse.json(
        { error: "Invalid price or stock." },
        { status: 400 },
      );
    }

    const product = await Product.findOneAndUpdate(
      { id },
      {
        $set: {
          name,
          sku,
          category,
          price,
          stock,
          image: String(body.image ?? ""),
          description: String(body.description ?? ""),
          status: body.status === "inactive" ? "inactive" : "active",
          sizes: Array.isArray(body.sizes) ? body.sizes : [],
          colors: Array.isArray(body.colors) ? body.colors : [],
          rating: Number(body.rating ?? 0),
        },
      },
      {
        returnDocument: "after",
        runValidators: true,
      },
    ).lean();

    if (!product) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Product updated successfully.",
      product,
    });
  } catch (error) {
    console.error("PATCH product error:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json(
        { error: "This SKU already exists." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Unable to update product." },
      { status: 500 },
    );
  }
}

// DELETE: Delete product
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in again." },
        { status: 401 },
      );
    }

    const id = await getProductId(context);

    if (id === null) {
      return NextResponse.json(
        { error: "Invalid product ID." },
        { status: 400 },
      );
    }

    await connectDB();

    const product = await Product.findOneAndDelete({ id });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Product deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE product error:", error);

    return NextResponse.json(
      { error: "Unable to delete product." },
      { status: 500 },
    );
  }
}
