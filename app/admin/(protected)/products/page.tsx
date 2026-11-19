"use client";

import Products from "./_components/products";

import {
  SidebarProvider,
  useSidebar,
} from "../../../../contexts/sidebar-contexts";
import { Sidebar } from "../orders/_component/leftside-bar";

function ProductsContent() {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-w-0 flex-1 flex-col transition-all duration-300 ease-in-out ">
      <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-3">
        <Products />
      </main>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-x-hidden bg-gray-50">
        {/* <Sidebar /> */}
        <ProductsContent />
      </div>
    </SidebarProvider>
  );
}
