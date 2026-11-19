"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";

import { useOverviewData } from "./use-overview-data";
import OverviewStats from "./overview-stats";
import RevenueOverview from "./revenue-overview";
import PaymentMethods from "./payment-methods";
import TransactionStatus from "./transaction-status";
import RecentTransactions from "./recent-transactions";

export default function Overview() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { t } = useTranslation();
  const overview = useOverviewData();

  const handleRefresh = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);

    try {
      await overview.refresh();
    } catch (error) {
      console.error("Failed to refresh overview:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {t("overview.title")}
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            {t("overview.description")}
          </p>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="bg-white"
          onClick={handleRefresh}
          disabled={isRefreshing}
          aria-label={t("overview.refresh")}
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
        </Button>
      </div>

      {/* Error Message */}
      {overview.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {overview.error}
        </div>
      )}

      {/* Statistics */}
      <OverviewStats
        totalRevenue={overview.totalRevenue ?? 0}
        totalTransactions={overview.totalTransactions ?? 0}
        averageOrder={overview.averageOrder ?? 0}
        productsSold={overview.productsSold ?? 0}
      />

      {/* Revenue + Payment Methods */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.8fr)]">
        <RevenueOverview />

        <PaymentMethods paymentMethods={overview.paymentMethods ?? []} />
      </div>

      {/* Transaction Status */}
      <TransactionStatus
        successful={overview.successfulTransactions ?? 0}
        pending={overview.pendingTransactions ?? 0}
        failed={overview.failedTransactions ?? 0}
        refunded={overview.refundedTransactions ?? 0}
      />

      {/* Recent Transactions */}
      <RecentTransactions transactions={overview.recentTransactions ?? []} />
    </div>
  );
}
