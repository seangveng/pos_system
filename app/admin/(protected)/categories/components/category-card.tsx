"use client";

import { MoreVertical, Pencil, Tag, Trash2 } from "lucide-react";

import { Button } from "../../../../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../../../components/ui/dropdown-menu";

import { useTranslation } from "@/hooks/use-translation";
import type { Category } from "../types/categories";

interface CategoryCardProps {
  category: Category;
  productCount: number;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

export function CategoryCard({
  category,
  productCount,
  onEdit,
  onDelete,
}: CategoryCardProps) {
  const { t } = useTranslation();

  // Translate category names without changing MongoDB values.
  const translateCategoryName = (name: string) => {
    const normalizedName = name.trim().toLowerCase();

    const categoryKeys: Record<string, string> = {
      drink: "categories.drinks",
      drinks: "categories.drinks",
      beverage: "categories.drinks",
      beverages: "categories.drinks",

      bakery: "categories.bakery",

      beer: "categories.beers",
      beers: "categories.beers",

      cake: "categories.cakes",
      cakes: "categories.cakes",
    };

    const translationKey = categoryKeys[normalizedName];

    return translationKey ? t(translationKey) : name;
  };

  return (
    <article
      className="
        group
        relative
        overflow-hidden
        rounded-2xl
        border
        border-gray-200
        bg-white
        shadow-sm
        transition-all
        duration-300
        hover:-translate-y-1
        hover:shadow-lg
      "
    >
      {/* Top Color */}
      <div
        className="h-1.5 w-full"
        style={{
          backgroundColor: category.color || "#14b8a6",
        }}
      />

      <div className="p-4">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-gray-50
              "
              style={{
                color: category.color || "#14b8a6",
              }}
            >
              <Tag className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h3
                title={translateCategoryName(category.name)}
                className="
                  truncate
                  text-sm
                  font-semibold
                  text-gray-900
                "
              >
                {translateCategoryName(category.name)}
              </h3>

              <p className="mt-0.5 text-xs text-gray-400">
                {t("categories.card.category")}
              </p>
            </div>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="
                  h-8
                  w-8
                  shrink-0
                  rounded-full
                  text-gray-400
                  hover:bg-gray-100
                  hover:text-gray-700
                "
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(category)}>
                <Pencil className="mr-2 h-4 w-4" />
                {t("categories.card.edit")}
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => onDelete(category)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t("categories.card.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Description */}
        <p
          title={category.description || t("categories.card.noDescription")}
          className="
            mb-4
            min-h-[40px]
            line-clamp-2
            text-xs
            leading-5
            text-gray-500
          "
        >
          {category.description || t("categories.card.noDescription")}
        </p>

        {/* Footer */}
        <div
          className="
            flex
            items-center
            justify-between
            border-t
            border-gray-100
            pt-3
          "
        >
          <span className="text-xs text-gray-400">
            {t("categories.card.products")}
          </span>

          <span
            className="
              rounded-full
              bg-teal-50
              px-2.5
              py-1
              text-xs
              font-semibold
              text-teal-700
            "
          >
            {productCount.toLocaleString()}
          </span>
        </div>
      </div>
    </article>
  );
}
