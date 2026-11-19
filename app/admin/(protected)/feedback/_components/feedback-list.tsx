"use client";

import { MessageSquareOff } from "lucide-react";

import { FeedbackCard } from "./feedback-card";
import { FeedbackItem } from "../_types/feedback";

interface FeedbackListProps {
  feedback: FeedbackItem[];
  onEdit: (feedback: FeedbackItem) => void;
  onDelete: (feedback: FeedbackItem) => void;
  onToggleStatus: (feedback: FeedbackItem) => void;
}

export function FeedbackList({
  feedback,
  onEdit,
  onDelete,
  onToggleStatus,
}: FeedbackListProps) {
  if (feedback.length === 0) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
          <MessageSquareOff className="h-5 w-5" />
        </div>

        <h3 className="mt-3 text-sm font-semibold text-gray-900">
          No feedback found
        </h3>

        <p className="mt-1 max-w-sm text-xs text-gray-500">
          Try changing your search or filters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {feedback.map((item) => (
        <FeedbackCard
          key={item.id}
          feedback={item}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleStatus={onToggleStatus}
        />
      ))}
    </div>
  );
}
