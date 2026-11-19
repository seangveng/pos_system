"use client";

import { Sidebar } from "../orders/_component/leftside-bar";
import {
  SidebarProvider,
  useSidebar,
} from "../../../../contexts/sidebar-contexts";
import Categories from "./components/categories";

function CategoriesContent() {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-w-0 flex-1 flex-col transition-all duration-300 ease-in-out ">
      <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-4">
        <Categories />
      </main>
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-x-hidden bg-gray-50">
        <CategoriesContent />
      </div>
    </SidebarProvider>
  );
}
