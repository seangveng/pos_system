"use client";

import Feedback from "./_components/feedback";

import { Sidebar } from "../orders/_component/leftside-bar";

import {
  SidebarProvider,
  useSidebar,
} from "../../../../contexts/sidebar-contexts";

function FeedbackContent() {
  const { isCollapsed } = useSidebar();

  return (
    <div
      className={`min-w-0 flex-1 flex-col transition-all duration-300 ease-in-out ${
        isCollapsed ? "lg:ml-16 ml-0" : "lg:ml-64 ml-0"
      }`}
    >
      <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-3">
        <Feedback />
      </main>
    </div>
  );
}

export default function FeedbackPage() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-x-hidden bg-gray-50">
        <FeedbackContent />
      </div>
    </SidebarProvider>
  );
}
