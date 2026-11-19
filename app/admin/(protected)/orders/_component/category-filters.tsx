"use client";

import { Beer, Cake, Coffee, Croissant, FileText, Tag } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";

interface CategoryFiltersProps {
  categories: string[];
  active: string;
  onChange: (category: string) => void;
  totalProducts: number;
}

const categoryIcons: Record<string, typeof FileText> = {
  "all products": FileText,
  drinks: Coffee,
  drink: Coffee,
  cakes: Cake,
  cake: Cake,
  bakery: Croissant,
  beers: Beer,
  beer: Beer,
};

const categoryTranslationKeys: Record<string, string> = {
  "all products": "categories.all",
  drinks: "categories.drinks",
  drink: "categories.drinks",
  cakes: "categories.cakes",
  cake: "categories.cakes",
  bakery: "categories.bakery",
  beers: "categories.beers",
  beer: "categories.beers",
};

export function CategoryFilters({
  categories,
  active,
  onChange,
  totalProducts,
}: CategoryFiltersProps) {
  const { t } = useTranslation();

  const allCategories = Array.from(
    new Set([
      "All Products",
      ...categories
        .map((category) => String(category ?? "").trim())
        .filter(Boolean),
    ]),
  );

  const normalizeCategory = (name: string) => name.trim().toLowerCase();

  return (
    <div className="w-full min-w-0 overflow-x-auto scrollbar-hide py-1">
      <div className="inline-flex min-w-max items-center rounded-2xl border border-white/60 bg-white/45 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06]">
        {allCategories.map((name) => {
          const normalized = normalizeCategory(name);

          const Icon = categoryIcons[normalized] ?? Tag;

          const translationKey = categoryTranslationKeys[normalized];

          const translatedName = translationKey ? t(translationKey) : name;

          const isActive = normalizeCategory(active) === normalized;

          return (
            <button
              key={name}
              type="button"
              onClick={() => onChange(name)}
              aria-pressed={isActive}
              className={`
                group inline-flex shrink-0 items-center justify-center gap-2
                rounded-xl px-3.5 py-2.5
                text-sm font-medium whitespace-nowrap
                transition-all duration-200 ease-out
                ${
                  isActive
                    ? "border border-white/80 bg-white/90 text-teal-700 shadow-md shadow-black/[0.06] dark:border-white/15 dark:bg-white/15 dark:text-teal-300"
                    : "border border-transparent bg-transparent text-gray-500 hover:bg-white/60 hover:text-teal-700 dark:text-gray-400 dark:hover:bg-white/[0.08] dark:hover:text-teal-300"
                }
              `}
            >
              <Icon
                className={`h-4 w-4 transition-colors ${
                  isActive
                    ? "text-teal-600 dark:text-teal-300"
                    : "text-gray-400 group-hover:text-teal-600"
                }`}
                strokeWidth={1.8}
              />

              <span>{translatedName}</span>

              {normalized === "all products" && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    isActive
                      ? "bg-teal-50 text-teal-700 dark:bg-teal-400/10 dark:text-teal-300"
                      : "bg-gray-100/80 text-gray-500 dark:bg-white/10 dark:text-gray-400"
                  }`}
                >
                  {totalProducts}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
