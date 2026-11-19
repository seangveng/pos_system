import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRODUCT_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=0, s-maxage=15, stale-while-revalidate=30",
};

export async function GET() {
  try {
    await connectDB();

    const products = await Product.find({
      status: "active",
    })
      .select({
        _id: 0,
        id: 1,
        name: 1,
        sku: 1,
        category: 1,
        price: 1,
        stock: 1,
        trackStock: 1,
        image: 1,
        description: 1,
        status: 1,
        sizes: 1,
        colors: 1,
        rating: 1,
      })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return NextResponse.json(
      {
        success: true,
        products,
      },
      {
        status: 200,
        headers: PRODUCT_CACHE_HEADERS,
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Unable to load products. Please try again.",
        products: [],
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
