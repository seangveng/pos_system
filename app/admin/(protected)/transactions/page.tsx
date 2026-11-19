"use client";

import { Sidebar } from "../orders/_component/leftside-bar";
import Transactions from "./_component/transactions";
import {
  SidebarProvider,
  useSidebar,
} from "../../../../contexts/sidebar-contexts";

function TransactionContent() {
  const { isCollapsed } = useSidebar();

  return (
    <div>
      <main className="flex-1 p-3 overflow-y-auto">
        <Transactions />
      </main>
    </div>
  );
}

export default function TransactionPage() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-gray-50">
        <TransactionContent />
      </div>
    </SidebarProvider>
  );
}
