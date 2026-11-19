"use client";

import { useCallback, useEffect, useState } from "react";
import type { Products } from "@/app/admin/(protected)/orders/_type/products";

export function useProducts() {
  const [products, setProducts] = useState<Products[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProducts = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/products", {
        method: "GET",
        cache: "no-store",
        signal,
      });

      const data: { products?: Products[]; message?: string } =
        await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load products.");
      }

      setProducts(Array.isArray(data.products) ? data.products : []);
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err.message || "Something went wrong.");
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    void fetchProducts(controller.signal);

    return () => controller.abort();
  }, [fetchProducts]);

  const refreshProducts = useCallback(() => {
    return fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    setProducts,
    refreshProducts,
  };
}
