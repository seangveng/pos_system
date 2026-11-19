"use client";

import { Clock3, MessageCircle, Star, ThumbsUp } from "lucide-react";

interface FeedbackStatsProps {
  total: number;
  averageRating: number;
  positive: number;
  pending: number;
}

export function FeedbackStats({
  total,
  averageRating,
  positive,
  pending,
}: FeedbackStatsProps) {
  const stats = [
    {
      label: "Total Feedback",
      value: total,
      icon: MessageCircle,
    },
    {
      label: "Average Rating",
      value: averageRating.toFixed(1),
      icon: Star,
    },
    {
      label: "Positive",
      value: positive,
      icon: ThumbsUp,
    },
    {
      label: "Pending",
      value: pending,
      icon: Clock3,
    },
  ];

  return (
    <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.label}
            className="rounded-2xl border border-gray-200 bg-white p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-gray-500">
                  {stat.label}
                </p>

                <p className="mt-1 text-xl font-bold text-gray-900">
                  {stat.value}
                </p>
              </div>

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                <Icon className="h-4 w-4" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
