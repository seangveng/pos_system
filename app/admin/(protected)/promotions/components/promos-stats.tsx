"use client";

import { CheckCircle2, CircleOff, Tag, Users } from "lucide-react";

interface PromosStatsProps {
  totalPromos: number;
  activePromos: number;
  inactivePromos: number;
  totalUsed: number;
}

export function PromosStats({
  totalPromos,
  activePromos,
  inactivePromos,
  totalUsed,
}: PromosStatsProps) {
  const stats = [
    {
      label: "Total Promos",
      value: totalPromos,
      icon: Tag,
      iconClass: "bg-teal-50 text-teal-600",
    },
    {
      label: "Active",
      value: activePromos,
      icon: CheckCircle2,
      iconClass: "bg-green-50 text-green-600",
    },
    {
      label: "Inactive",
      value: inactivePromos,
      icon: CircleOff,
      iconClass: "bg-gray-100 text-gray-600",
    },
    {
      label: "Total Used",
      value: totalUsed,
      icon: Users,
      iconClass: "bg-blue-50 text-blue-600",
    },
  ];

  return (
    <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.label}
            className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm"
            aria-label={`${stat.label}: ${stat.value}`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${stat.iconClass}`}
              >
                <Icon aria-hidden="true" className="h-4 w-4" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-[10px] text-gray-500 sm:text-xs">
                  {stat.label}
                </p>

                <p className="text-lg font-bold text-gray-900 sm:text-xl">
                  {Number(stat.value || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
