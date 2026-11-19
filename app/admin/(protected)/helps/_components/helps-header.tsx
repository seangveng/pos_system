"use client";

import { HelpCircle } from "lucide-react";

export function HelpsHeader() {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
          <HelpCircle className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-gray-900 sm:text-2xl">
            Help Center
          </h1>

          <p className="truncate text-xs text-gray-500 sm:text-sm">
            Find answers and learn how to use your POS system
          </p>
        </div>
      </div>
    </div>
  );
}
