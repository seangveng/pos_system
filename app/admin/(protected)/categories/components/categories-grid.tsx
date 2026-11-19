"use client";

import { useMemo, useState } from "react";
import { Search, Tag } from "lucide-react";

import { Input } from "../../../../../components/ui/input";
import { CategoryCard } from "./category-card";
import { useTranslation } from "@/hooks/use-translation";

import type { Category } from "../types/categories";
import type { Products } from "../../orders/_type/products";

interface CategoriesGridProps {
  categories: Category[];
  products: Products[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

export function CategoriesGrid({
  categories,
  products,
  onEdit,
  onDelete,
}: CategoriesGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { t } = useTranslation();

  const productCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    products.forEach((product) => {
      const category = String(product.category || "")
        .trim()
        .toLowerCase();

      if (!category) return;

      counts[category] = (counts[category] || 0) + 1;
    });

    return counts;
  }, [products]);

  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return categories;

    return categories.filter(
      (category) =>
        category.name.toLowerCase().includes(query) ||
        (category.description || "").toLowerCase().includes(query),
    );
  }, [categories, searchQuery]);

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

        <Input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={t("categories.searchPlaceholder")}
          className="h-11 border-gray-200 bg-white pl-10"
        />
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          {t("categories.grid.showing", {
            count: filteredCategories.length,
          })}
        </span>
      </div>

      {categories.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <div className="mb-3 rounded-full bg-teal-50 p-4">
            <Tag className="h-7 w-7 text-teal-600" />
          </div>

          <h3 className="font-semibold text-gray-900">
            {t("categories.grid.noCategoriesYet")}
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            {t("categories.grid.addFirstCategory")}
          </p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
          <Search className="mx-auto mb-3 h-7 w-7 text-gray-400" />

          <h3 className="font-semibold text-gray-900">
            {t("categories.grid.noMatchingCategories")}
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            {t("categories.grid.tryAnotherSearch")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              productCount={
                productCounts[category.name.trim().toLowerCase()] || 0
              }
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
