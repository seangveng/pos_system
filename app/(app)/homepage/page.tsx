"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  ShoppingCart,
  Package,
  Loader2,
  RefreshCw,
} from "lucide-react";

type Product = {
  id: number | string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  image?: string;
  description?: string;
};

export default function CustomerHomepage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/products", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load products.");
        }

        const data = await response.json();

        if (!cancelled) {
          setProducts(Array.isArray(data.products) ? data.products : []);
        }
      } catch {
        if (!cancelled) {
          setError("We couldn't load products. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(
    () => [
      "All",
      ...Array.from(new Set(products.map((p) => p.category)).values()),
    ],
    [products],
  );

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        category === "All" || product.category === category;

      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [products, search, category]);

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/homepage" className="text-xl font-bold tracking-tight">
            BUNCHHEANG <span className="text-emerald-600">CAFE</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-gray-500 sm:inline">
              Shop our products
            </span>
            <Link
              href="/cart"
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <ShoppingCart className="h-4 w-4" />
              Cart
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <section className="mb-8 rounded-2xl bg-emerald-700 p-6 text-white sm:p-10">
          <p className="mb-2 text-sm font-medium text-emerald-100">
            WELCOME TO BUN CHHEANG <CAFE></CAFE>
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Find your favorites.
          </h1>
          <p className="mt-3 max-w-xl text-sm text-emerald-50 sm:text-base">
            Browse our products and order what you need.
          </p>
        </section>

        <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Our Products</h2>
            <p className="mt-1 text-sm text-gray-500">
              {filteredProducts.length} products available
            </p>
          </div>

          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        </section>

        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {categories.map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                category === item
                  ? "bg-emerald-600 text-white"
                  : "border border-gray-200 bg-white text-gray-600 hover:border-emerald-300"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex min-h-48 items-center justify-center gap-3 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading products...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-white p-8 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-xl border bg-white p-12 text-center">
            <Package className="mx-auto h-10 w-10 text-gray-400" />
            <h3 className="mt-4 font-semibold">No products found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try another search or category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredProducts.map((product) => (
              <article
                key={product.id}
                className="overflow-hidden rounded-2xl border border-gray-100 bg-white transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex aspect-square items-center justify-center bg-gray-100">
                  {product.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Package className="h-12 w-12 text-gray-300" />
                  )}
                </div>

                <div className="p-3 sm:p-4">
                  <p className="truncate text-xs text-gray-500">
                    {product.category}
                  </p>
                  <h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-semibold">
                    {product.name}
                  </h3>

                  <p className="mt-2 text-lg font-bold text-emerald-700">
                    ${Number(product.price).toFixed(2)}
                  </p>

                  <p
                    className={`mt-1 text-xs ${
                      product.stock > 0 ? "text-gray-500" : "text-red-600"
                    }`}
                  >
                    {product.stock > 0
                      ? `${product.stock} in stock`
                      : "Out of stock"}
                  </p>

                  <button
                    disabled={product.stock <= 0}
                    onClick={() =>
                      alert(
                        "Cart integration is the next step. Selected: " +
                          product.name,
                      )
                    }
                    className="mt-3 w-full rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      Add to Cart
                    </span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
