"use client";

import { BookOpen } from "lucide-react";

import { HELP_CATEGORIES } from "../_action/helps";

import { HelpCategoryCard } from "./help-category-card";
import { HelpCategory } from "../_types/helps";

interface HelpsCategoriesProps {
  onCategoryClick: (category: HelpCategory) => void;
}

export function HelpsCategories({ onCategoryClick }: HelpsCategoriesProps) {
  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
          <BookOpen className="h-4 w-4" />
        </div>

        <div>
          <h2 className="text-sm font-bold text-gray-900">
            Browse by Category
          </h2>

          <p className="text-xs text-gray-500">
            Find help based on what you need.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {HELP_CATEGORIES.map((category) => (
          <HelpCategoryCard
            key={category.id}
            category={category}
            onClick={onCategoryClick}
          />
        ))}
      </div>
    </section>
  );
}
