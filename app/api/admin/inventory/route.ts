import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import { ADMIN_SESSION_COOKIE, getAdminSession } from "@/lib/admin-auth";
import User from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Role = "STAFF" | "ADMIN" | "OWNER";

async function getCurrentRole(request: NextRequest): Promise<Role | null> {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const session = getAdminSession(token);

  if (!session) return null;

  const email = session.email.toLowerCase().trim();

  if (session.role === "OWNER") {
    const ownerEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
    return ownerEmail && email === ownerEmail ? "OWNER" : null;
  }

  if (session.role !== "ADMIN" && session.role !== "STAFF") {
    return null;
  }

  await connectDB();

  const user = await User.findOne({ email }).select("role status").lean();

  if (!user || user.status !== "ACTIVE" || user.role !== session.role) {
    return null;
  }

  return user.role;
}

// GET: View inventory
export async function GET(request: NextRequest) {
  try {
    const role = await getCurrentRole(request);

    if (!role) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 },
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const lowStock = searchParams.get("lowStock") === "true";

    const filter: Record<string, unknown> = {
      trackStock: true,
    };

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    if (lowStock) {
      filter.$expr = { $lte: ["$stock", 10] };
    }

    const products = await Product.find(filter)
      .select("name sku stock trackStock price category image")
      .sort({ stock: 1, name: 1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        inventory: products,
        summary: {
          totalProducts: products.length,
          lowStockProducts: products.filter(
            (product) => Number(product.stock || 0) <= 10,
          ).length,
          outOfStockProducts: products.filter(
            (product) => Number(product.stock || 0) <= 0,
          ).length,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Unable to retrieve inventory." },
      { status: 500 },
    );
  }
}

// PATCH: Update stock
export async function PATCH(request: NextRequest) {
  try {
    const role = await getCurrentRole(request);

    if (!role) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const productId = typeof body.productId === "string" ? body.productId : "";
    const quantity = Number(body.quantity);
    const operation = body.operation;

    if (!/^[a-f\d]{24}$/i.test(productId)) {
      return NextResponse.json(
        { success: false, message: "Invalid product ID." },
        { status: 400 },
      );
    }

    if (!Number.isSafeInteger(quantity) || quantity < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Quantity must be a non-negative whole number.",
        },
        { status: 400 },
      );
    }

    if (!["SET", "ADD", "REMOVE"].includes(operation)) {
      return NextResponse.json(
        { success: false, message: "Operation must be SET, ADD or REMOVE." },
        { status: 400 },
      );
    }

    if (operation !== "SET" && role === "STAFF") {
      return NextResponse.json(
        { success: false, message: "Only ADMIN or OWNER can adjust stock." },
        { status: 403 },
      );
    }

    await connectDB();

    const product = await Product.findById(productId);

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found." },
        { status: 404 },
      );
    }

    const currentStock = Number(product.stock || 0);

    let newStock = quantity;

    if (operation === "ADD") {
      newStock = currentStock + quantity;
    }

    if (operation === "REMOVE") {
      newStock = currentStock - quantity;

      if (newStock < 0) {
        return NextResponse.json(
          { success: false, message: "Insufficient stock." },
          { status: 400 },
        );
      }
    }

    product.stock = newStock;
    product.trackStock = true;

    await product.save();

    return NextResponse.json({
      success: true,
      message: "Inventory updated successfully.",
      inventory: {
        productId: product._id.toString(),
        name: product.name,
        previousStock: currentStock,
        quantity: newStock,
        operation,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Unable to update inventory." },
      { status: 500 },
    );
  }
}
