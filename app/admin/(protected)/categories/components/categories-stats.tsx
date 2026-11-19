"use client";

import { Package, Tag, TrendingUp } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";

interface CategoriesStatsProps {
  totalCategories: number;
  totalProducts: number;
  activeCategories: number;
}

export function CategoriesStats({
  totalCategories,
  totalProducts,
  activeCategories,
}: CategoriesStatsProps) {
  const { t } = useTranslation();

  const stats = [
    {
      label: t("categories.stats.totalCategories"),
      value: totalCategories,
      description: t("categories.stats.allAvailableCategories"),
      icon: Tag,
      iconBg: "bg-teal-50",
      iconColor: "text-teal-600",
    },
    {
      label: t("categories.stats.totalProducts"),
      value: totalProducts,
      description: t("categories.stats.productsAcrossCategories"),
      icon: Package,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      label: t("categories.stats.activeCategories"),
      value: activeCategories,
      description: t("categories.stats.categoriesWithActiveProducts"),
      icon: TrendingUp,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {stat.label}
                </p>

                <h3 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
                  {stat.value.toLocaleString()}
                </h3>

                <p className="mt-2 text-xs text-gray-400">{stat.description}</p>
              </div>

              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.iconBg}`}
              >
                <Icon className={`h-6 w-6 ${stat.iconColor}`} strokeWidth={2} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
