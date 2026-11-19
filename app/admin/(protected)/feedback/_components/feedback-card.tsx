"use client";

import { Check, Edit, Mail, MessageCircleReply, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FeedbackItem } from "../_types/feedback";

interface FeedbackCardProps {
  feedback: FeedbackItem;
  onEdit: (feedback: FeedbackItem) => void;
  onDelete: (feedback: FeedbackItem) => void;
  onToggleStatus: (feedback: FeedbackItem) => void;
}

function formatDate(date: string) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));
  } catch {
    return date;
  }
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={star <= rating ? "text-yellow-400" : "text-gray-200"}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export function FeedbackCard({
  feedback,
  onEdit,
  onDelete,
  onToggleStatus,
}: FeedbackCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-gray-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50 text-sm font-semibold text-teal-700">
            {feedback.customerName.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-gray-900">
              {feedback.customerName}
            </h3>

            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-400">
              <Mail className="h-3.5 w-3.5" />

              <span className="truncate">{feedback.email}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onToggleStatus(feedback)}
          className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-medium ${
            feedback.status === "Unread"
              ? "bg-orange-50 text-orange-700"
              : feedback.status === "Replied"
                ? "bg-teal-50 text-teal-700"
                : "bg-gray-100 text-gray-600"
          }`}
        >
          {feedback.status}
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <RatingStars rating={feedback.rating} />

        <span className="text-[11px] text-gray-400">
          {formatDate(feedback.createdAt)}
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-gray-600">{feedback.message}</p>

      {feedback.reply && (
        <div className="mt-4 rounded-xl bg-gray-50 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
            <MessageCircleReply className="h-4 w-4 text-teal-600" />
            Your Reply
          </div>

          <p className="mt-1.5 text-xs leading-5 text-gray-500">
            {feedback.reply}
          </p>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
        <span className="text-[11px] text-gray-400">
          Click status to change
        </span>

        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onEdit(feedback)}
            className="h-8 w-8 rounded-lg text-gray-500 hover:bg-teal-50 hover:text-teal-600"
          >
            <Edit className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onDelete(feedback)}
            className="h-8 w-8 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
