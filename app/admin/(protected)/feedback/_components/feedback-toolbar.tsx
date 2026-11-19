"use client";

import { Filter, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";

interface FeedbackToolbarProps {
  search: string;
  rating: string;
  status: string;
  onSearchChange: (value: string) => void;
  onRatingChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onAddFeedback: () => void;
}

export function FeedbackToolbar({
  search,
  rating,
  status,
  onSearchChange,
  onRatingChange,
  onStatusChange,
  onAddFeedback,
}: FeedbackToolbarProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-3 sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

          <input
            type="text"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search feedback..."
            className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          />
        </div>

        <Button
          type="button"
          onClick={onAddFeedback}
          className="h-10 rounded-xl bg-teal-600 px-4 text-sm hover:bg-teal-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Feedback
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />

          <select
            value={rating}
            onChange={(event) => onRatingChange(event.target.value)}
            className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          >
            <option value="all">All Ratings</option>

            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>

        <select
          value={status}
          onChange={(event) => onStatusChange(event.target.value)}
          className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
        >
          <option value="all">All Status</option>

          <option value="Unread">Unread</option>

          <option value="Read">Read</option>

          <option value="Replied">Replied</option>
        </select>
      </div>
    </div>
  );
}
