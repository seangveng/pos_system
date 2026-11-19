"use client";

import { Filter, Search, X } from "lucide-react";

import { CategoryFilters } from "./category-filters";
import type { Products } from "../_type/products";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../../../components/ui/dropdown-menu";

import { Button } from "../../../../../components/ui/button";
import { Input } from "@/components/ui/input";

interface ProductFiltersProps {
  products: Products[];
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortOption: string;
  setSortOption: (option: string) => void;
  categories?: string[];
  filteredCount?: number;
}

export function ProductFilters({
  products,
  activeCategory,
  setActiveCategory,
  searchQuery,
  setSearchQuery,
  sortOption,
  setSortOption,
  categories = [],
  filteredCount = 0,
}: ProductFiltersProps) {
  const allCategories = Array.from(
    new Set([
      "All Products",
      ...categories
        .map((category) => String(category ?? "").trim())
        .filter(Boolean),
    ]),
  );

  return (
    <div className="w-full min-w-0 space-y-3">
      {/* Search and sorting */}
      <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search products by name or SKU..."
            className="h-10 w-full pl-9 pr-9"
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="h-10 shrink-0 gap-2"
            >
              <Filter className="h-4 w-4" />
              {sortOption}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSortOption("Newest")}>
              Newest
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => setSortOption("Price: Low to High")}
            >
              Price: Low to High
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => setSortOption("Price: High to Low")}
            >
              Price: High to Low
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Dynamic categories */}
      <CategoryFilters
        categories={allCategories}
        active={activeCategory}
        onChange={setActiveCategory}
        totalProducts={products.length}
      />

      {/* Results count */}
      <div className="text-sm text-gray-500">
        Showing{" "}
        <span className="font-semibold text-foreground">{filteredCount}</span>{" "}
        of {products.length} products
      </div>
    </div>
  );
}
