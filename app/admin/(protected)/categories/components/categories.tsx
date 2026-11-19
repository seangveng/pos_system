"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { CategoriesHeader } from "./categories-header";
import { CategoriesStats } from "./categories-stats";
import { CategoriesGrid } from "./categories-grid";
import { CategoryDialog } from "./category-dialog";
import { DeleteCategoryDialog } from "./delete-category-dialog";

import type { Category } from "../types/categories";
import type { Products } from "../../orders/_type/products";

import {
  CATEGORIES_UPDATED_EVENT,
  getCategories,
} from "../../actions/categories";

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Products[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );

  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null,
  );

  const fetchProducts = async (): Promise<Products[]> => {
    const response = await fetch("/api/products", {
      method: "GET",
      cache: "no-store",
      credentials: "same-origin",
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        data?.error || data?.message || "Failed to load products.",
      );
    }

    if (!data || !Array.isArray(data.products)) {
      throw new Error("Invalid products response from server.");
    }

    return data.products as Products[];
  };

  const loadData = useCallback(async () => {
    try {
      setError("");

      const [categoryData, productData] = await Promise.all([
        getCategories(),
        fetchProducts(),
      ]);

      setCategories(categoryData);
      setProducts(productData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load categories and products.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();

    const handleCategoryUpdate = () => {
      void loadData();
    };

    const handleStorageUpdate = (event: StorageEvent) => {
      if (event.key === "pos-categories" || event.key === "pos-products") {
        void loadData();
      }
    };

    window.addEventListener(CATEGORIES_UPDATED_EVENT, handleCategoryUpdate);
    window.addEventListener("storage", handleStorageUpdate);

    return () => {
      window.removeEventListener(
        CATEGORIES_UPDATED_EVENT,
        handleCategoryUpdate,
      );
      window.removeEventListener("storage", handleStorageUpdate);
    };
  }, [loadData]);

  // Merge saved categories with categories found in products.
  // Existing category details are preserved.
  const displayCategories = useMemo(() => {
    const categoryMap = new Map<string, Category>();

    categories.forEach((category) => {
      const key = category.name.trim().toLowerCase();

      if (key) {
        categoryMap.set(key, category);
      }
    });

    let nextId = Math.max(
      0,
      ...categories.map((category) => Number(category.id) || 0),
    );

    products.forEach((product) => {
      const name = String(product.category || "").trim();
      const key = name.toLowerCase();

      if (!key || categoryMap.has(key)) return;

      nextId += 1;

      categoryMap.set(key, {
        id: -nextId,
        name,
        description: "",
        color: "#14b8a6",
      } as Category);
    });

    return Array.from(categoryMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [categories, products]);

  const totalCategories = displayCategories.length;
  const totalProducts = products.length;

  const activeProducts = useMemo(
    () =>
      products.filter(
        (product) => String(product.status || "").toLowerCase() === "active",
      ),
    [products],
  );

  const activeCategories = useMemo(
    () =>
      displayCategories.filter((category) =>
        activeProducts.some(
          (product) =>
            String(product.category || "")
              .trim()
              .toLowerCase() === category.name.trim().toLowerCase(),
        ),
      ).length,
    [displayCategories, activeProducts],
  );

  const selectedCategoryProductCount = useMemo(() => {
    if (!categoryToDelete) return 0;

    return products.filter(
      (product) =>
        String(product.category || "")
          .trim()
          .toLowerCase() === categoryToDelete.name.trim().toLowerCase(),
    ).length;
  }, [products, categoryToDelete]);

  const handleAddCategory = () => {
    setSelectedCategory(null);
    setIsDialogOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    // Product-derived categories are display-only until saved
    // as actual Category documents.
    if (category.id < 0) {
      setSelectedCategory(null);
      setIsDialogOpen(true);
      return;
    }

    setSelectedCategory(category);
    setIsDialogOpen(true);
  };

  const handleDeleteCategory = (category: Category) => {
    setCategoryToDelete(category);
    setIsDeleteDialogOpen(true);
  };

  const handleSaved = async () => {
    await loadData();
  };

  const handleDeleted = async () => {
    await loadData();
    setCategoryToDelete(null);
  };

  return (
    <div className="w-full space-y-5">
      <CategoriesHeader onAddCategory={handleAddCategory} />

      <CategoriesStats
        totalCategories={totalCategories}
        totalProducts={totalProducts}
        activeCategories={activeCategories}
      />

      {error && (
        <div className="flex flex-col gap-2 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-red-700">{error}</p>

          <button
            type="button"
            onClick={() => void loadData()}
            className="text-sm font-semibold text-red-700 underline"
          >
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[250px] items-center justify-center rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
            Loading categories...
          </div>
        </div>
      ) : (
        <CategoriesGrid
          categories={displayCategories}
          products={products}
          onEdit={handleEditCategory}
          onDelete={handleDeleteCategory}
        />
      )}

      <CategoryDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        category={selectedCategory}
        onSaved={handleSaved}
      />

      <DeleteCategoryDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        category={categoryToDelete}
        productCount={selectedCategoryProductCount}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
