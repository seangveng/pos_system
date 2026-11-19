"use client";

import { Sidebar } from "../orders/_component/leftside-bar";

import {
  SidebarProvider,
  useSidebar,
} from "../../../../contexts/sidebar-contexts";

import Overview from "./_component/overview";

function OverviewContent() {
  const { isCollapsed } = useSidebar();

  return (
    <div>
      <main className="min-h-screen min-w-0 flex-1 overflow-x-hidden bg-gray-50 p-3 sm:p-4 lg:p-6">
        <Overview />
      </main>
    </div>
  );
}

export default function OverviewPage() {
  return (
    <SidebarProvider>
      <div>
        <OverviewContent />
      </div>
    </SidebarProvider>
  );
}
