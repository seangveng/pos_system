"use client";

import { MessageSquareText } from "lucide-react";

export function FeedbackHeader() {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
          <MessageSquareText className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-gray-900 sm:text-2xl">
            Feedback
          </h1>

          <p className="truncate text-xs text-gray-500 sm:text-sm">
            Manage customer feedback and reviews
          </p>
        </div>
      </div>
    </div>
  );
}
