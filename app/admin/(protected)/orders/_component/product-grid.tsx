"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";

import { DashboardHeader } from "./dashbaord-header";
import type { Products } from "../_type/products";
import ProductCard from "./product-card";

const PRODUCTS_UPDATED_EVENT = "pos-products-updated";

type ProductsResponse = {
  success?: boolean;
  products?: Products[];
  message?: string;
  error?: string;
};

function normalizeProduct(product: Partial<Products>): Products | null {
  const id = Number(product.id);

  if (!Number.isFinite(id) || id <= 0) {
    return null;
  }

  return {
    id,
    name: String(product.name ?? ""),
    sku: String(product.sku ?? ""),
    price: Number(product.price ?? 0),
    rating: product.rating === undefined ? undefined : Number(product.rating),
    reviewCount:
      product.reviewCount === undefined
        ? undefined
        : Number(product.reviewCount),
    category: String(product.category ?? "Uncategorized").trim(),
    image: String(product.image ?? ""),
    stock: Number(product.stock ?? 0),
    description: product.description ? String(product.description) : undefined,
    status: product.status ?? "active",
    sizes: Array.isArray(product.sizes) ? product.sizes : [],
    colors: Array.isArray(product.colors) ? product.colors : [],
  };
}

export function ProductsGrid() {
  const [products, setProducts] = useState<Products[]>([]);
  const [activeCategory, setActiveCategory] = useState("All Products");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("Newest");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const abortControllerRef = useRef<AbortController | null>(null);

  const loadProducts = useCallback(async () => {
    abortControllerRef.current?.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setError("");

      const response = await fetch("/api/products", {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      });

      const data: ProductsResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Failed to load products.",
        );
      }

      const productList = Array.isArray(data.products) ? data.products : [];

      const normalizedProducts = productList
        .map((product) => normalizeProduct(product))
        .filter((product): product is Products => product !== null)
        .filter((product) => product.status !== "inactive");

      setProducts(normalizedProducts);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }

      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadProducts();

    const handleProductsUpdated = () => {
      loadProducts();
    };

    window.addEventListener(PRODUCTS_UPDATED_EVENT, handleProductsUpdated);

    return () => {
      abortControllerRef.current?.abort();

      window.removeEventListener(PRODUCTS_UPDATED_EVENT, handleProductsUpdated);
    };
  }, [loadProducts]);

  // Dynamic categories from MongoDB products
  const categories = useMemo(() => {
    return Array.from(
      new Set(
        products.map((product) => product.category.trim()).filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b));
  }, [products]);

  // Reset category if it no longer exists
  useEffect(() => {
    if (
      activeCategory !== "All Products" &&
      !categories.some(
        (category) => category.toLowerCase() === activeCategory.toLowerCase(),
      )
    ) {
      setActiveCategory("All Products");
    }
  }, [activeCategory, categories]);

  // Search, category filtering and sorting
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    let result = products.filter((product) => {
      const matchesCategory =
        activeCategory === "All Products" ||
        product.category.toLowerCase() === activeCategory.toLowerCase();

      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });

    switch (sortOption) {
      case "Price: Low to High":
        result = [...result].sort((a, b) => a.price - b.price);
        break;

      case "Price: High to Low":
        result = [...result].sort((a, b) => b.price - a.price);
        break;

      case "Newest":
      default:
        result = [...result].sort((a, b) => b.id - a.id);
        break;
    }

    return result;
  }, [products, activeCategory, searchQuery, sortOption]);

  return (
    <section className="flex min-h-full w-full min-w-0 flex-col gap-4">
      {/* Dashboard Header - Render only once */}
      <div className="sticky top-0 z-30 shrink-0">
        <DashboardHeader
          products={products}
          activeCategory={activeCategory || "All Products"}
          setActiveCategory={setActiveCategory}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sortOption={sortOption}
          setSortOption={setSortOption}
          categories={categories}
          filteredCount={filteredProducts.length}
        />
      </div>

      {/* Product Grid */}
      <div className="min-w-0 flex-1 pb-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="h-64 animate-pulse rounded-xl bg-muted"
              />
            ))}
          </div>
        ) : error ? (
          <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-xl border border-destructive/20 bg-background p-6 text-center">
            <p className="text-sm text-destructive">{error}</p>

            <button
              type="button"
              onClick={loadProducts}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-700"
            >
              Try Again
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex min-h-48 items-center justify-center rounded-xl border border-dashed bg-background p-6 text-center">
            <div>
              <p className="font-medium text-foreground">No products found</p>

              <p className="mt-1 text-sm text-muted-foreground">
                Try another category or search term.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
