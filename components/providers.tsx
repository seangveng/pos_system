"use client";

import type { ReactNode } from "react";

import { LanguageProvider } from "@/contexts/language-context";
import { CartProvider } from "@/contexts/cart-context";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <CartProvider>{children}</CartProvider>
    </LanguageProvider>
  );
}
