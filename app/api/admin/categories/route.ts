import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, unstable_cache } from "next/cache";

import connectDB from "@/lib/mongodb";
import Category from "@/models/Category";
import Counter from "@/models/Counter";

import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CACHE_TAG = "admin-categories";

async function isAdmin(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

  if (!token) return false;

  try {
    return Boolean(await verifyAdminSession(token));
  } catch {
    return false;
  }
}

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { success: false, message },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* Cached category query */
const getCachedCategories = unstable_cache(
  async () => {
    await connectDB();

    const categories = await Category.find()
      .select("id name description color createdAt updatedAt -_id")
      .sort({ id: 1 })
      .lean()
      .exec();

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description || "",
      color: category.color,
      createdAt: category.createdAt
        ? new Date(category.createdAt).toISOString()
        : null,
      updatedAt: category.updatedAt
        ? new Date(category.updatedAt).toISOString()
        : null,
    }));
  },
  ["admin-categories-list-v1"],
  {
    revalidate: 30,
    tags: [CACHE_TAG],
  },
);

/* GET: Load all categories */
export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return errorResponse("Unauthorized", 401);
  }

  try {
    const categories = await getCachedCategories();

    return NextResponse.json(
      {
        success: true,
        categories,
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    return errorResponse("Failed to load categories", 500);
  }
}

/* POST: Create category */
export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return errorResponse("Unauthorized", 401);
  }

  try {
    await connectDB();

    const body = await request.json();

    const name = String(body.name || "").trim();
    const description = String(body.description || "").trim();
    const color = String(body.color || "#14b8a6").trim();

    if (!name) {
      return errorResponse("Category name is required", 400);
    }

    if (name.length > 50) {
      return errorResponse("Category name must be 50 characters or less", 400);
    }

    if (description.length > 500) {
      return errorResponse(
        "Category description must be 500 characters or less",
        400,
      );
    }

    if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
      return errorResponse("Please provide a valid hex color", 400);
    }

    const duplicate = await Category.findOne({
      name: {
        $regex: `^${escapeRegex(name)}$`,
        $options: "i",
      },
    }).lean();

    if (duplicate) {
      return errorResponse("Category name already exists", 409);
    }

    // Make sure the counter is not behind existing category IDs.
    const highestCategory = await Category.findOne()
      .sort({ id: -1 })
      .select("id")
      .lean();

    const highestId = highestCategory?.id ?? 0;

    await Counter.updateOne(
      { _id: "category" },
      { $max: { sequence: highestId } },
      { upsert: true },
    );

    const counter = await Counter.findByIdAndUpdate(
      "category",
      { $inc: { sequence: 1 } },
      {
        returnDocument: "after",
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );

    if (!counter) {
      return errorResponse("Failed to generate category ID", 500);
    }

    const category = await Category.create({
      id: counter.sequence,
      name,
      description,
      color,
    });

    revalidateTag(CACHE_TAG);

    return NextResponse.json(
      {
        success: true,
        message: "Category created successfully",
        category: {
          id: category.id,
          name: category.name,
          description: category.description,
          color: category.color,
          createdAt: category.createdAt.toISOString(),
          updatedAt: category.updatedAt.toISOString(),
        },
      },
      {
        status: 201,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return errorResponse("Category ID already exists", 409);
    }

    return errorResponse("Failed to create category", 500);
  }
}
