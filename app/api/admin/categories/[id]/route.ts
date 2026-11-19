import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

import connectDB from "@/lib/mongodb";
import Category from "@/models/Category";
import Product from "@/models/Product";

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

type RouteContext = {
  params: Promise<{ id: string }>;
};

/* PATCH: Update category */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  if (!(await isAdmin(request))) {
    return errorResponse("Unauthorized", 401);
  }

  try {
    await connectDB();

    const { id: idParam } = await params;
    const id = Number(idParam);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return errorResponse("Invalid category ID", 400);
    }

    const body = await request.json();

    const existing = await Category.findOne({ id });

    if (!existing) {
      return errorResponse("Category not found", 404);
    }

    const name =
      body.name !== undefined ? String(body.name).trim() : existing.name;

    const description =
      body.description !== undefined
        ? String(body.description).trim()
        : existing.description || "";

    const color =
      body.color !== undefined ? String(body.color).trim() : existing.color;

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
      id: { $ne: id },
      name: {
        $regex: `^${escapeRegex(name)}$`,
        $options: "i",
      },
    }).lean();

    if (duplicate) {
      return errorResponse("Category name already exists", 409);
    }

    const oldName = existing.name;

    // Update products when the category name changes.
    if (oldName !== name) {
      await Product.updateMany(
        {
          category: {
            $regex: `^${escapeRegex(oldName.trim())}$`,
            $options: "i",
          },
        },
        {
          $set: { category: name },
        },
      );
    }

    existing.name = name;
    existing.description = description;
    existing.color = color;

    await existing.save();

    revalidateTag(CACHE_TAG);

    // The public products API also uses HTTP cache headers.
    revalidatePath("/api/products");

    return NextResponse.json(
      {
        success: true,
        message: "Category updated successfully",
        category: {
          id: existing.id,
          name: existing.name,
          description: existing.description || "",
          color: existing.color,
          createdAt: existing.createdAt.toISOString(),
          updatedAt: existing.updatedAt.toISOString(),
        },
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    return errorResponse("Failed to update category", 500);
  }
}

/* DELETE: Delete category only when no products use it */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  if (!(await isAdmin(request))) {
    return errorResponse("Unauthorized", 401);
  }

  try {
    await connectDB();

    const { id: idParam } = await params;
    const id = Number(idParam);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return errorResponse("Invalid category ID", 400);
    }

    const category = await Category.findOne({ id });

    if (!category) {
      return errorResponse("Category not found", 404);
    }

    // Do not delete a category that is still assigned to products.
    const productCount = await Product.countDocuments({
      category: {
        $regex: `^${escapeRegex(category.name.trim())}$`,
        $options: "i",
      },
    });

    if (productCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete this category because ${productCount} product(s) still use it.`,
          productCount,
        },
        {
          status: 409,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }

    await Category.deleteOne({ id });

    revalidateTag(CACHE_TAG);

    return NextResponse.json(
      {
        success: true,
        message: "Category deleted successfully",
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    return errorResponse("Failed to delete category", 500);
  }
}
