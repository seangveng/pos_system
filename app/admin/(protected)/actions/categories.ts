import { Category } from "../categories/types/categories";

export const CATEGORIES_UPDATED_EVENT = "pos-categories-updated";

export const CATEGORIES_API_URL = "/api/admin/categories";

type CategoryInput = {
  name: string;
  description: string;
  color: string;
};

type CategoryUpdateInput = Partial<CategoryInput>;

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  categories?: T[];
  category?: T;
}

/* ============================================================
   API HELPER
============================================================ */

async function apiRequest<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    if (response.status === 404) {
      throw new Error("Categories API not found. Please check your API route.");
    }

    throw new Error(
      "Invalid server response. Please check your API route and admin login.",
    );
  }

  const data = (await response.json()) as T & ApiResponse<unknown>;

  if (!response.ok || data.success === false) {
    throw new Error(
      data.message || `Request failed with status ${response.status}`,
    );
  }

  return data;
}

/* ============================================================
   DISPATCH UPDATE EVENT
============================================================ */

function dispatchCategoriesUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CATEGORIES_UPDATED_EVENT));
  }
}

/* ============================================================
   GET ALL CATEGORIES
============================================================ */

export async function getCategories(): Promise<Category[]> {
  const data = await apiRequest<ApiResponse<Category>>(CATEGORIES_API_URL, {
    method: "GET",
  });

  return data.categories || [];
}

/* ============================================================
   GET SINGLE CATEGORY
============================================================ */

export async function getCategoryById(id: number): Promise<Category | null> {
  const categories = await getCategories();

  return categories.find((category) => category.id === id) || null;
}

/* ============================================================
   ADD CATEGORY
============================================================ */

export async function addCategory(input: CategoryInput): Promise<Category> {
  const name = input.name.trim();

  if (!name) {
    throw new Error("Category name is required");
  }

  if (name.length > 50) {
    throw new Error("Category name must be 50 characters or less");
  }

  const data = await apiRequest<ApiResponse<Category>>(CATEGORIES_API_URL, {
    method: "POST",
    body: JSON.stringify({
      name,
      description: input.description.trim(),
      color: input.color,
    }),
  });

  if (!data.category) {
    throw new Error("Failed to create category");
  }

  dispatchCategoriesUpdated();

  return data.category;
}

/* ============================================================
   UPDATE CATEGORY
============================================================ */

export async function updateCategory(
  id: number,
  input: CategoryUpdateInput,
): Promise<Category> {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("Invalid category ID");
  }

  const data = await apiRequest<ApiResponse<Category>>(
    `${CATEGORIES_API_URL}/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );

  if (!data.category) {
    throw new Error("Failed to update category");
  }

  dispatchCategoriesUpdated();

  return data.category;
}

/* ============================================================
   DELETE CATEGORY
============================================================ */

export async function deleteCategory(id: number): Promise<boolean> {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("Invalid category ID");
  }

  await apiRequest<ApiResponse<never>>(`${CATEGORIES_API_URL}/${id}`, {
    method: "DELETE",
  });

  dispatchCategoriesUpdated();

  return true;
}

/* ============================================================
   CHECK CATEGORY NAME EXISTS
============================================================ */

export async function categoryNameExists(
  name: string,
  excludeId?: number,
): Promise<boolean> {
  const normalizedName = name.trim().toLowerCase();

  if (!normalizedName) {
    return false;
  }

  const categories = await getCategories();

  return categories.some(
    (category) =>
      category.id !== excludeId &&
      category.name.trim().toLowerCase() === normalizedName,
  );
}

/* ============================================================
   SAVE CATEGORY
   Compatibility helper for callers that need to create/update.
============================================================ */

export async function saveCategory(
  input: CategoryInput,
  id?: number,
): Promise<Category> {
  return id ? updateCategory(id, input) : addCategory(input);
}
