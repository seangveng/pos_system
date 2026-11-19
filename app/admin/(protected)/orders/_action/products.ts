"use server";

import type { Products } from "../_type/products";

export async function getProducts(): Promise<Products[]> {
  throw new Error(
    "getProducts server action is no longer used. Fetch /api/products directly from the client.",
  );
}

export async function addProduct(
  newProduct: Products,
): Promise<{ success: boolean; product: Products }> {
  const response = await fetch(
    `${process.env.APP_URL || "http://localhost:3000"}/api/products`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newProduct),
      cache: "no-store",
    },
  );

  const data = await response.json();

  if (!response.ok || !data.product) {
    throw new Error(data.message || data.error || "Unable to add product.");
  }

  return {
    success: true,
    product: data.product,
  };
}
