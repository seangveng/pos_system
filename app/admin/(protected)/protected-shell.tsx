"use client";

import type { ReactNode } from "react";

import { SidebarProvider, useSidebar } from "@/contexts/sidebar-contexts";

import { Sidebar } from "./orders/_component/leftside-bar";

function ProtectedContent({ children }: { children: ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <div>
      <main>{children}</main>
    </div>
  );
}

export default function ProtectedShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div>
        {/* <Sidebar /> */}
        <ProtectedContent>{children}</ProtectedContent>
      </div>
    </SidebarProvider>
  );
}
