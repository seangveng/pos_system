"use client";

import { Sidebar } from "../orders/_component/leftside-bar";

import {
  SidebarProvider,
  useSidebar,
} from "../../../../contexts/sidebar-contexts";

import { Promos } from "./components/promos";

function PromosContent() {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-w-0 flex-1 flex-col transition-all duration-300 ease-in-out ">
      <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-3">
        <Promos />
      </main>
    </div>
  );
}

export default function PromosPage() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-x-hidden bg-gray-50 dark:bg-gray-950">
        <PromosContent />
      </div>
    </SidebarProvider>
  );
}
