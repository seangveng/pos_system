"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { Transaction } from "@/types/transaction";

// ============================================================
// API TYPES
// ============================================================

interface ReportsSummary {
  totalOrders: number;
  paidOrders: number;
  unpaidOrders: number;
  failedOrders?: number;
  refundedOrders?: number;
  totalRevenue: number;
  averagePaidOrderValue: number;
  productsSold?: number;
}

interface PaymentStatusSummary {
  status: string;
  count: number;
}

interface PaymentSummary {
  paymentMethod: string;
  count: number;
  amount: number;
}

interface ReportOrder {
  _id: string;
  orderNumber?: string;
  customerName?: string;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  orderSource?: string;
  createdAt: string;
}

interface ReportsResponse {
  success: boolean;
  summary: ReportsSummary;
  statusSummary: {
    status: string;
    count: number;
  }[];
  paymentStatusSummary: PaymentStatusSummary[];
  paymentSummary: PaymentSummary[] | null;
  orders: ReportOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

// ============================================================
// HELPERS
// ============================================================

function safeNumber(value: unknown): number {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function safeDate(value: unknown): string {
  if (!value) {
    return new Date(0).toISOString();
  }

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return new Date(0).toISOString();
  }

  return date.toISOString();
}

function getPaymentStatus(status: string): Transaction["status"] {
  const normalized = status.toUpperCase();

  switch (normalized) {
    case "PAID":
      return "PAID";

    case "UNPAID":
    case "PENDING":
      return "PENDING";

    case "FAILED":
      return "FAILED";

    case "REFUNDED":
      return "REFUNDED";

    case "CANCELLED":
      return "CANCELLED";

    default:
      return "PENDING";
  }
}

// Convert MongoDB OnlineOrder into the existing Transaction type.
// Keep payment status separate from fulfillment status.
function normalizeOrder(order: ReportOrder): Transaction {
  const total = safeNumber(order.total);

  return {
    id: order._id,
    storeId: "",
    customerName: order.customerName || "Guest",
    amount: total,
    currency: "USD",
    gateway: order.paymentMethod || "OTHER",
    status: getPaymentStatus(order.paymentStatus),
    createdAt: safeDate(order.createdAt),
    paidAt:
      order.paymentStatus === "PAID" ? safeDate(order.createdAt) : undefined,
    subtotal: total,
    regularDiscount: 0,
    promoDiscount: 0,
    promoCode: "",
    tax: 0,
    total,
    itemCount: 0,
    items: [],
  } as Transaction;
}

// ============================================================
// HOOK
// ============================================================

export function useOverviewData() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [report, setReport] = useState<ReportsResponse | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  // ============================================================
  // LOAD REPORTS FROM MONGODB
  // ============================================================

  const loadTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/admin/reports?page=1&limit=20", {
        method: "GET",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = (await response.json()) as ReportsResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load dashboard reports.");
      }

      const normalized = Array.isArray(data.orders)
        ? data.orders.map(normalizeOrder)
        : [];

      setReport(data);
      setTransactions(normalized);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load dashboard data.",
      );

      setReport(null);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    void loadTransactions();
  }, [loadTransactions]);

  // ============================================================
  // SUMMARY
  // ============================================================

  const summary = report?.summary;

  // ============================================================
  // PAID TRANSACTIONS
  // ============================================================

  const paidTransactions = useMemo(() => {
    return transactions.filter((transaction) => transaction.status === "PAID");
  }, [transactions]);

  // ============================================================
  // TOTAL REVENUE
  // ============================================================

  const totalRevenue = safeNumber(summary?.totalRevenue);

  // ============================================================
  // TOTAL TRANSACTIONS
  // ============================================================

  const totalTransactions = safeNumber(summary?.totalOrders);

  // ============================================================
  // SUCCESSFUL TRANSACTIONS
  // ============================================================

  const successfulTransactions = safeNumber(summary?.paidOrders);

  // ============================================================
  // PAYMENT STATUS COUNTS
  // ============================================================

  const getPaymentStatusCount = useCallback(
    (status: string): number => {
      const item = report?.paymentStatusSummary?.find(
        (entry) => entry.status.toUpperCase() === status.toUpperCase(),
      );

      return safeNumber(item?.count);
    },
    [report],
  );

  // ============================================================
  // PENDING TRANSACTIONS
  // ============================================================

  const pendingTransactions = useMemo(() => {
    return safeNumber(summary?.unpaidOrders ?? getPaymentStatusCount("UNPAID"));
  }, [summary, getPaymentStatusCount]);

  // ============================================================
  // FAILED TRANSACTIONS
  // ============================================================

  const failedTransactions = useMemo(() => {
    return safeNumber(summary?.failedOrders ?? getPaymentStatusCount("FAILED"));
  }, [summary, getPaymentStatusCount]);

  // ============================================================
  // REFUNDED TRANSACTIONS
  // ============================================================

  const refundedTransactions = useMemo(() => {
    return safeNumber(
      summary?.refundedOrders ?? getPaymentStatusCount("REFUNDED"),
    );
  }, [summary, getPaymentStatusCount]);

  // ============================================================
  // AVERAGE ORDER VALUE
  // ============================================================

  const averageOrder = safeNumber(summary?.averagePaidOrderValue);

  // ============================================================
  // PAYMENT METHODS
  // ============================================================

  const paymentMethods = useMemo(() => {
    const methods = report?.paymentSummary ?? [];

    const total = methods.reduce(
      (sum, item) => sum + safeNumber(item.amount),
      0,
    );

    return methods
      .map((item) => ({
        name: item.paymentMethod || "OTHER",
        amount: safeNumber(item.amount),
        transactions: safeNumber(item.count),

        percentage:
          total > 0 ? Math.round((safeNumber(item.amount) / total) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [report]);

  // ============================================================
  // RECENT TRANSACTIONS
  // ============================================================

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      })
      .slice(0, 5);
  }, [transactions]);

  // ============================================================
  // RETURN
  // ============================================================

  return {
    transactions,
    paidTransactions,

    totalRevenue,
    totalTransactions,

    successfulTransactions,
    pendingTransactions,
    failedTransactions,
    refundedTransactions,

    averageOrder,

    paymentMethods,
    recentTransactions,

    isLoading,
    error,

    refresh: loadTransactions,
  };
}
