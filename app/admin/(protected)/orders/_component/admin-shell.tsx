"use client";

import type { ReactNode } from "react";

import { Sidebar } from "./leftside-bar";
import { useSidebar } from "@/contexts/sidebar-contexts";

export default function AdminShell({ children }: { children: ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen w-full">
      <Sidebar />

      <main
        className={`
          min-h-screen
          min-w-0
          w-full
          transition-all
          duration-300
          ease-in-out
          ml-0
          ${
            isCollapsed
              ? "lg:ml-16 lg:w-[calc(100%-4rem)]"
              : "lg:ml-64 lg:w-[calc(100%-16rem)]"
          }
        `}
      >
        {children}
      </main>
    </div>
  );
}
