"use client";

import { ProductsGrid } from "./admin/(protected)/orders/_component/product-grid";
import { CartSidebar } from "./admin/(protected)/orders/_component/cart-siderbar";

import { SidebarProvider } from "../contexts/sidebar-contexts";
import { CartProvider } from "../hooks/use-carts";

function DashboardContent() {
  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-background">
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden ">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-accent/50 p-2 shadow-sm sm:p-3">
            {/* Main Content */}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 lg:flex-row lg:overflow-hidden">
              {/* Products - Header + Filters + Independent Scroll */}
              <div
                className="
                  min-h-0 min-w-0 flex-1
                  overflow-x-hidden overflow-y-auto
                  overscroll-y-contain
                  touch-pan-y
                  rounded-xl
                  [scrollbar-width:thin]
                  [&::-webkit-scrollbar]:w-2
                  [&::-webkit-scrollbar-thumb]:rounded-full
                  [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30
                "
              >
                <ProductsGrid />
              </div>

              {/* Customer Cart */}
              <aside>
                <CartSidebar mode="customer" />
              </aside>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function Dashboard() {
  return (
    <SidebarProvider>
      <CartProvider>
        <DashboardContent />
      </CartProvider>
    </SidebarProvider>
  );
}
