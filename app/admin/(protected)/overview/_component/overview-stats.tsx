"use client";

import {
  DollarSign,
  ShoppingCart,
  Receipt,
  Package,
  TrendingUp,
} from "lucide-react";

import { useTranslation } from "@/hooks/use-translation";

interface OverviewStatsProps {
  totalRevenue?: number;
  totalTransactions?: number;
  averageOrder?: number;
  productsSold?: number;
}

interface StatItem {
  key: string;
  value: string;
  description: string;
  icon: React.ElementType;
  iconClass: string;
}

const formatCurrency = (value: number | undefined | null): string => {
  const safeValue = Number(value ?? 0);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(safeValue) ? safeValue : 0);
};

const formatNumber = (value: number | undefined | null): string => {
  const safeValue = Number(value ?? 0);

  return new Intl.NumberFormat("en-US").format(
    Number.isFinite(safeValue) ? safeValue : 0,
  );
};

export default function OverviewStats({
  totalRevenue = 0,
  totalTransactions = 0,
  averageOrder = 0,
  productsSold = 0,
}: OverviewStatsProps) {
  const { t } = useTranslation();

  const stats: StatItem[] = [
    {
      key: "revenue",
      value: formatCurrency(totalRevenue),
      description: t("overview.stats.revenueDescription"),
      icon: DollarSign,
      iconClass: "bg-emerald-500/10 text-emerald-600",
    },
    {
      key: "transactions",
      value: formatNumber(totalTransactions),
      description: t("overview.stats.transactionsDescription"),
      icon: ShoppingCart,
      iconClass: "bg-blue-500/10 text-blue-600",
    },
    {
      key: "averageOrder",
      value: formatCurrency(averageOrder),
      description: t("overview.stats.averageOrderDescription"),
      icon: Receipt,
      iconClass: "bg-violet-500/10 text-violet-600",
    },
    {
      key: "productsSold",
      value: formatNumber(productsSold),
      description: t("overview.stats.productsSoldDescription"),
      icon: Package,
      iconClass: "bg-orange-500/10 text-orange-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.key}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">
                {t(`overview.stats.${stat.key}Title`)}
              </p>

              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.iconClass}`}
              >
                <Icon className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-2xl font-bold tracking-tight text-gray-900">
                {stat.value}
              </h3>

              <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                <TrendingUp className="h-3.5 w-3.5" />
                {stat.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
