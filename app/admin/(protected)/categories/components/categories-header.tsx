"use client";

import { Plus, Tag } from "lucide-react";

import { Button } from "../../../../../components/ui/button";
import { useTranslation } from "@/hooks/use-translation";

interface CategoriesHeaderProps {
  onAddCategory: () => void;
}

export function CategoriesHeader({ onAddCategory }: CategoriesHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="mb-4">
      <div
        className="
          flex flex-col gap-3 rounded-xl border border-gray-200
          bg-white p-4 shadow-sm
          sm:flex-row sm:items-center sm:justify-between
        "
      >
        {/* Left */}
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="
              flex h-10 w-10 shrink-0 items-center justify-center
              rounded-xl bg-teal-50 text-teal-600
            "
          >
            <Tag className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-gray-900 sm:text-xl">
              {t("categories.title")}
            </h1>

            <p className="truncate text-xs text-gray-500 sm:text-sm">
              {t("categories.subtitle")}
            </p>
          </div>
        </div>

        {/* Add Button */}
        <Button
          type="button"
          onClick={onAddCategory}
          className="
            w-full rounded-lg bg-teal-600 text-white
            hover:bg-teal-700 sm:w-auto
          "
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("categories.addCategory")}
        </Button>
      </div>
    </header>
  );
}
