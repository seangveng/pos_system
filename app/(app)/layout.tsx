import type { ReactNode } from "react";
import { CartProvider } from "@/contexts/cart-context";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <div className="min-h-screen bg-slate-50">{children}</div>
    </CartProvider>
  );
}
