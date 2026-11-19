import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import Counter from "@/models/Counter";

import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/admin-auth";
import Product from "@/models/Product";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Check admin authentication
async function isAdmin(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

  if (!token) return false;

  try {
    return Boolean(await verifyAdminSession(token));
  } catch {
    return false;
  }
}

// GET: Get all products for admin
export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in again." },
        { status: 401 },
      );
    }

    await connectDB();

    const products = await Product.find({}).sort({ createdAt: -1 }).lean();

    return NextResponse.json(
      { products },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to load products." },
      { status: 500 },
    );
  }
}

// POST: Create a new product
export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in again." },
        { status: 401 },
      );
    }

    await connectDB();

    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid product data." },
        { status: 400 },
      );
    }

    // Basic product information
    const name = String(body.name ?? "").trim();
    const sku = String(body.sku ?? "")
      .trim()
      .toUpperCase();
    const category = String(body.category ?? "").trim();

    // Numeric values
    const price = Number(body.price);
    const stock = Number(body.stock ?? 0);
    const rating = Number(body.rating ?? 0);

    // Optional stock tracking
    // Only products explicitly marked true will track inventory.
    const trackStock = body.trackStock === true;

    // Validate required fields
    if (!name || !sku || !category) {
      return NextResponse.json(
        {
          error: "Name, SKU, and category are required.",
        },
        { status: 400 },
      );
    }

    // Validate numeric fields
    if (
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isFinite(stock) ||
      stock < 0 ||
      !Number.isFinite(rating) ||
      rating < 0
    ) {
      return NextResponse.json(
        {
          error: "Price, stock, and rating must be valid non-negative numbers.",
        },
        { status: 400 },
      );
    }

    // Check duplicate SKU
    const existingProduct = await Product.findOne({ sku });

    if (existingProduct) {
      return NextResponse.json(
        { error: "A product with this SKU already exists." },
        { status: 409 },
      );
    }

    // Generate product ID
    const counter = await Counter.findByIdAndUpdate(
      "product",
      { $inc: { sequence: 1 } },
      {
        returnDocument: "after",
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );

    if (!counter) {
      throw new Error("Unable to generate product ID.");
    }

    // Create product
    const product = await Product.create({
      id: counter.sequence,
      name,
      sku,
      category,
      price,
      stock,

      // Important: preserve optional inventory tracking.
      trackStock,

      image: String(body.image ?? ""),
      description: String(body.description ?? ""),

      status: body.status === "inactive" ? "inactive" : "active",

      sizes: Array.isArray(body.sizes) ? body.sizes : [],
      colors: Array.isArray(body.colors) ? body.colors : [],

      rating,
    });

    return NextResponse.json(
      {
        message: "Product created successfully.",
        product,
      },
      { status: 201 },
    );
  } catch (error) {
    // Handle duplicate SKU from MongoDB unique index
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
      { error: "Unable to create product." },
      { status: 500 },
    );
  }
}
