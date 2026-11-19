"use client";

import type React from "react";
import { createContext, useCallback, useContext, useState } from "react";

interface SidebarContextType {
  isOpen: boolean;
  isCollapsed: boolean;
  toggle: () => void;
  close: () => void;
  open: () => void;
  toggleCollapse: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggle = useCallback(() => {
    if (window.innerWidth < 1024) {
      setIsOpen((previous) => !previous);
    } else {
      setIsCollapsed((previous) => !previous);
    }
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((previous) => !previous);
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        isOpen,
        isCollapsed,
        toggle,
        close,
        open,
        toggleCollapse,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);

  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }

  return context;
}
