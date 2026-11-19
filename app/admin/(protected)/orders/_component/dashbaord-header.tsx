"use client";

import { Filter, Search, X } from "lucide-react";

import { Button } from "../../../../../components/ui/button";
import { Input } from "../../../../../components/ui/input";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../../../components/ui/dropdown-menu";

import { CategoryFilters } from "./category-filters";
import type { Products } from "../_type/products";

import { useTranslation } from "@/hooks/use-translation";

interface DashboardHeaderProps {
  products?: Products[] | null;
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortOption: string;
  setSortOption: (option: string) => void;
  categories?: string[] | null;
  filteredCount?: number;
}

export function DashboardHeader({
  products,
  activeCategory,
  setActiveCategory,
  searchQuery,
  setSearchQuery,
  sortOption,
  setSortOption,
  categories,
  filteredCount,
}: DashboardHeaderProps) {
  const { t } = useTranslation();

  const safeProducts = Array.isArray(products) ? products : [];
  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeFilteredCount = filteredCount ?? 0;

  const sortOptions = [
    { value: "Newest", label: t("products.sort.newest") },
    {
      value: "Price: Low to High",
      label: t("products.sort.priceLowToHigh"),
    },
    {
      value: "Price: High to Low",
      label: t("products.sort.priceHighToLow"),
    },
  ];

  const currentSortLabel =
    sortOptions.find((option) => option.value === sortOption)?.label ??
    sortOption;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/50 bg-white/80 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-background/80">
      <div className="w-full space-y-3 bg-accent/50 px-2 py-3 sm:px-4">
        {/* Dashboard title and search */}
        <div className="flex w-full items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="truncate text-base font-semibold text-gray-900 dark:text-foreground sm:text-lg">
              {t("products.title")}
            </h3>
          </div>

          {/* Search */}
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t("products.searchPlaceholder")}
              className="h-10 w-full rounded-xl border-white/60 bg-white/60 pl-9 pr-9 shadow-sm backdrop-blur-xl focus-visible:ring-teal-500 dark:border-white/10 dark:bg-white/[0.05]"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label={t("products.clearSearch")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Sort dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="h-10 shrink-0 rounded-xl border border-white/60 bg-teal-50/80 text-teal-700 shadow-sm backdrop-blur-md hover:bg-teal-100 dark:border-white/10 dark:bg-teal-400/10 dark:text-teal-300 dark:hover:bg-teal-400/20"
              >
                <Filter className="mr-1 h-4 w-4" />
                {currentSortLabel}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              {sortOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setSortOption(option.value)}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Glass category tabs */}
        <CategoryFilters
          categories={safeCategories}
          active={activeCategory}
          onChange={setActiveCategory}
          totalProducts={safeProducts.length}
        />

        {/* Product count */}
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {t("products.showing")}{" "}
          <span className="font-semibold text-foreground">
            {safeFilteredCount}
          </span>{" "}
          {t("products.of")} {safeProducts.length} {t("products.products")}
        </div>
      </div>
    </header>
  );
}
