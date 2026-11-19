"use client";

import { useSidebar, SidebarProvider } from "@/contexts/sidebar-contexts";
import { ProductsGrid } from "./_component/product-grid";
import { CartSidebar } from "./_component/cart-siderbar";
import { CartProvider } from "@/contexts/cart-context";
import { Sidebar } from "./_component/leftside-bar";

function DashboardContent() {
  const { isCollapsed } = useSidebar();

  return (
    <main>
      <div className="min-h-screen bg-background ">
        <div className="mt-2 overflow-hidden rounded-lg border border-gray-200 bg-background">
          {/* POS Main Layout */}
          <div className="flex min-h-[calc(100vh-150px)] flex-col xl:flex-row">
            {/* Products Section */}
            <section className="min-w-0 flex-1 overflow-y-auto ">
              <ProductsGrid />
            </section>

            {/* Cart Section */}
            <aside
              className="
                  w-full min-w-0 shrink-0
                  border-t border-gray-200
                  bg-background
                  xl:sticky xl:top-0
                  xl:h-[calc(100vh-100px)]
                  xl:w-[340px]
                  xl:overflow-y-auto
                  xl:border-l xl:border-t-0
                "
            >
              <CartSidebar />
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function OrdersPage() {
  return (
    <SidebarProvider>
      <CartProvider>
        <div className="min-h-screen bg-background">
          <DashboardContent />
        </div>
      </CartProvider>
    </SidebarProvider>
  );
}
