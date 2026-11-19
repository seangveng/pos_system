"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  RefreshCw,
  Search,
  ShoppingBag,
  Eye,
  CalendarDays,
  Package,
  ChevronRight,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  AlertCircle,
  X,
} from "lucide-react";

import { SidebarProvider } from "@/contexts/sidebar-contexts";
import { useTranslation } from "@/hooks/use-translation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "COMPLETED"
  | "CANCELLED";

type PaymentStatus = "UNPAID" | "PAID" | "FAILED" | "REFUNDED";

type Order = {
  _id: string;
  orderNumber: string;
  orderSource: "ONLINE" | "STAFF";
  customer: {
    name: string;
    phone: string;
    address: string;
    notes?: string;
  };
  items: Array<{
    productId: number;
    name: string;
    quantity: number;
    price: number;
    image?: string;
    size?: string | null;
    color?: string | null;
  }>;
  subtotal: number;
  discount: number;
  promoCode?: string | null;
  tax: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  createdAt: string;
};

const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
];

const PAYMENT_STATUSES: PaymentStatus[] = [
  "UNPAID",
  "PAID",
  "FAILED",
  "REFUNDED",
];

/* =========================================
   LOCALE HELPER
========================================= */

function isKhmerLocale(locale: string) {
  return locale.toLowerCase().startsWith("km");
}

/* =========================================
   CURRENCY FORMAT
========================================= */

function formatCurrency(value: number, locale: string) {
  const isKhmer = isKhmerLocale(locale);

  return new Intl.NumberFormat(isKhmer ? "km-KH" : "en-US", {
    style: "currency",
    currency: "USD",
    numberingSystem: isKhmer ? "khmr" : "latn",
  }).format(value || 0);
}

/* =========================================
   DATE FORMAT
   Manual Khmer weekday and month translation
========================================= */

function formatDate(value: string, locale: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const isKhmer = isKhmerLocale(locale);

  // Get date and time in Cambodia timezone
  const cambodiaDate = new Date(
    date.toLocaleString("en-US", {
      timeZone: "Asia/Phnom_Penh",
    }),
  );

  // English date
  if (!isKhmer) {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Phnom_Penh",
    }).format(date);
  }

  // Khmer weekdays
  const khmerWeekdays = [
    "ថ្ងៃអាទិត្យ",
    "ថ្ងៃចន្ទ",
    "ថ្ងៃអង្គារ",
    "ថ្ងៃពុធ",
    "ថ្ងៃព្រហស្បតិ៍",
    "ថ្ងៃសុក្រ",
    "ថ្ងៃសៅរ៍",
  ];

  // Khmer months
  const khmerMonths = [
    "មករា",
    "កុម្ភៈ",
    "មីនា",
    "មេសា",
    "ឧសភា",
    "មិថុនា",
    "កក្កដា",
    "សីហា",
    "កញ្ញា",
    "តុលា",
    "វិច្ឆិកា",
    "ធ្នូ",
  ];

  // Convert English digits to Khmer digits
  const khmerNumber = (number: number) =>
    number.toString().replace(/\d/g, (digit) => "០១២៣៤៥៦៧៨៩"[Number(digit)]);

  const weekday = khmerWeekdays[cambodiaDate.getDay()];
  const day = khmerNumber(cambodiaDate.getDate());
  const month = khmerMonths[cambodiaDate.getMonth()];
  const year = khmerNumber(cambodiaDate.getFullYear());

  const hours = cambodiaDate.getHours();
  const minutes = cambodiaDate.getMinutes();

  const hour12 = hours % 12 || 12;
  const period = hours >= 12 ? "ល្ងាច" : "ព្រឹក";

  const time = `${khmerNumber(hour12)}:${khmerNumber(minutes).padStart(2, "០")} ${period}`;

  return `${weekday} ទី${day} ខែ${month} ឆ្នាំ${year} ម៉ោង ${time}`;
}

/* =========================================
   STATUS COLORS
========================================= */

function statusClass(status: string) {
  const styles: Record<string, string> = {
    PENDING:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    CONFIRMED:
      "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
    PROCESSING:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400",
    SHIPPED:
      "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
    COMPLETED:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    CANCELLED: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
    UNPAID:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    PAID: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    FAILED: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
    REFUNDED:
      "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
  };

  return (
    styles[status] ||
    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
  );
}

/* =========================================
   DASHBOARD CONTENT
========================================= */

function DashboardContent() {
  const { t, locale } = useTranslation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const [selectedApproveOrder, setSelectedApproveOrder] =
    useState<Order | null>(null);

  const [selectedPaymentOrder, setSelectedPaymentOrder] =
    useState<Order | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* =========================================
     TRANSLATION HELPERS
  ========================================= */

  const translateOrderStatus = (value: string) => {
    const key = `userOrders.orderStatuses.${value}`;
    const translated = t(key);

    return translated === key ? value : translated;
  };

  const translatePaymentStatus = (value: string) => {
    const key = `userOrders.paymentStatuses.${value}`;
    const translated = t(key);

    return translated === key ? value : translated;
  };

  const translatePaymentMethod = (value: string) => {
    const key = `userOrders.paymentMethods.${value.toLowerCase()}`;
    const translated = t(key);

    return translated === key ? value : translated;
  };

  /* =========================================
     FETCH ORDERS
  ========================================= */

  const fetchOrders = useCallback(
    async (signal?: AbortSignal, showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");
        setSuccess("");

        const params = new URLSearchParams({
          source: "ONLINE",
        });

        if (search.trim()) {
          params.set("search", search.trim());
        }

        if (status) {
          params.set("status", status);
        }

        if (paymentStatus) {
          params.set("paymentStatus", paymentStatus);
        }

        const response = await fetch(`/api/orders?${params.toString()}`, {
          method: "GET",
          cache: "no-store",
          credentials: "include",
          signal,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || t("userOrders.unableToLoadOrders"));
        }

        setOrders(Array.isArray(data.orders) ? data.orders : []);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : t("userOrders.somethingWentWrong"),
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [search, status, paymentStatus, t],
  );

  useEffect(() => {
    const controller = new AbortController();

    fetchOrders(controller.signal);

    return () => controller.abort();
  }, [fetchOrders]);

  /* =========================================
     UPDATE ORDER
  ========================================= */

  const updateOrder = async (
    order: Order,
    update: { status?: OrderStatus; paymentStatus?: PaymentStatus },
  ): Promise<boolean> => {
    if (updatingOrderId) return false;

    const isApproving = update.status === "CONFIRMED";
    const isConfirmingPayment = update.paymentStatus === "PAID";

    try {
      setUpdatingOrderId(order.orderNumber);
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/orders/${encodeURIComponent(order.orderNumber)}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(update),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t("userOrders.unableToUpdateOrder"));
      }

      if (!data.order) {
        throw new Error(t("userOrders.serverDidNotReturnUpdatedOrder"));
      }

      setOrders((currentOrders) =>
        currentOrders.map((item) =>
          item.orderNumber === order.orderNumber
            ? { ...item, ...data.order }
            : item,
        ),
      );

      setSuccess(
        isApproving
          ? t("userOrders.orderApprovedSuccessfully", {
              orderNumber: order.orderNumber,
            })
          : isConfirmingPayment
            ? t("userOrders.paymentConfirmedSuccessfully", {
                orderNumber: order.orderNumber,
              })
            : t("userOrders.orderUpdatedSuccessfully"),
      );

      if (isApproving) {
        setSelectedApproveOrder(null);
      }

      if (isConfirmingPayment) {
        setSelectedPaymentOrder(null);
      }

      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("userOrders.somethingWentWrong"),
      );

      return false;
    } finally {
      setUpdatingOrderId(null);
    }
  };

  /* =========================================
     SUMMARY DATA
  ========================================= */

  const totalRevenue = orders
    .filter((order) => order.paymentStatus === "PAID")
    .reduce((sum, order) => sum + order.total, 0);

  const pendingCount = orders.filter(
    (order) => order.status === "PENDING",
  ).length;

  const paidCount = orders.filter(
    (order) => order.paymentStatus === "PAID",
  ).length;

  const isPaymentUpdating =
    selectedPaymentOrder !== null &&
    updatingOrderId === selectedPaymentOrder.orderNumber;

  const isApproveUpdating =
    selectedApproveOrder !== null &&
    updatingOrderId === selectedApproveOrder.orderNumber;

  return (
    <main>
      <div className="min-h-screen bg-background">
        <div className="rounded-lg border border-gray-200 bg-accent/50 p-2 sm:p-3 dark:border-gray-800">
          {/* PAGE HEADER */}
          <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-background p-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                <ShoppingBag size={22} />
              </div>

              <div>
                <h1 className="text-lg font-bold text-foreground">
                  {t("userOrders.title")}
                </h1>

                <p className="text-sm text-muted-foreground">
                  {t("userOrders.subtitle")}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => fetchOrders(undefined, true)}
              disabled={loading || refreshing || !!updatingOrderId}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-background px-4 py-2 text-sm font-medium transition hover:bg-accent disabled:opacity-50 dark:border-gray-700"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              {t("common.refresh")}
            </button>
          </div>

          {/* SUMMARY CARDS */}
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title={t("userOrders.onlineOrders")}
              value={orders.length.toString()}
              icon={<ShoppingBag size={20} />}
            />

            <SummaryCard
              title={t("userOrders.pendingOrders")}
              value={pendingCount.toString()}
              icon={<CalendarDays size={20} />}
            />

            <SummaryCard
              title={t("userOrders.paidOrders")}
              value={paidCount.toString()}
              icon={<Package size={20} />}
            />

            <SummaryCard
              title={t("userOrders.paidRevenue")}
              value={formatCurrency(totalRevenue, locale)}
              icon={<span className="text-lg font-bold">$</span>}
            />
          </div>

          {/* ORDERS TABLE */}
          <section className="mt-3 overflow-hidden rounded-lg border border-gray-200 bg-background dark:border-gray-800">
            <div className="flex flex-col gap-3 border-b border-gray-200 p-4 dark:border-gray-800 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="font-semibold text-foreground">
                  {t("userOrders.onlineCustomerOrders")}
                </h2>

                <p className="mt-1 text-xs text-muted-foreground">
                  {t("userOrders.onlineShopDescription")}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="relative sm:col-span-1">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />

                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={t("userOrders.searchPlaceholder")}
                    className="h-10 w-full rounded-lg border border-gray-200 bg-background pl-9 pr-3 text-sm outline-none focus:border-emerald-500 dark:border-gray-700"
                  />
                </div>

                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="h-10 rounded-lg border border-gray-200 bg-background px-3 text-sm outline-none focus:border-emerald-500 dark:border-gray-700"
                >
                  <option value="">{t("userOrders.allOrderStatuses")}</option>

                  {ORDER_STATUSES.map((item) => (
                    <option key={item} value={item}>
                      {translateOrderStatus(item)}
                    </option>
                  ))}
                </select>

                <select
                  value={paymentStatus}
                  onChange={(event) => setPaymentStatus(event.target.value)}
                  className="h-10 rounded-lg border border-gray-200 bg-background px-3 text-sm outline-none focus:border-emerald-500 dark:border-gray-700"
                >
                  <option value="">{t("userOrders.allPaymentStatuses")}</option>

                  {PAYMENT_STATUSES.map((item) => (
                    <option key={item} value={item}>
                      {translatePaymentStatus(item)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ERROR */}
            {error && (
              <div className="m-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                <AlertCircle size={17} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* SUCCESS */}
            {success && (
              <div className="m-4 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400">
                <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* LOADING / EMPTY / ORDERS */}
            {loading ? (
              <div className="flex min-h-64 items-center justify-center">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <RefreshCw size={17} className="animate-spin" />
                  {t("userOrders.loadingOrders")}
                </div>
              </div>
            ) : orders.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center px-4 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-accent">
                  <ShoppingBag size={25} className="text-muted-foreground" />
                </div>

                <h3 className="font-semibold text-foreground">
                  {t("userOrders.noOrdersFound")}
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  {t("userOrders.changeFilters")}
                </p>
              </div>
            ) : (
              <>
                {/* DESKTOP TABLE */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[1150px] text-left text-sm">
                    <thead className="bg-accent/60 text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">{t("userOrders.order")}</th>
                        <th className="px-4 py-3">
                          {t("userOrders.customer")}
                        </th>
                        <th className="px-4 py-3">{t("userOrders.items")}</th>
                        <th className="px-4 py-3">{t("userOrders.total")}</th>
                        <th className="px-4 py-3">{t("userOrders.payment")}</th>
                        <th className="px-4 py-3">
                          {t("userOrders.orderStatus")}
                        </th>
                        <th className="px-4 py-3">{t("userOrders.date")}</th>
                        <th className="px-4 py-3 text-right">
                          {t("userOrders.actions")}
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {orders.map((order) => {
                        const isUpdating =
                          updatingOrderId === order.orderNumber;

                        return (
                          <tr
                            key={order._id || order.orderNumber}
                            className="transition hover:bg-accent/30"
                          >
                            <td className="px-4 py-4 font-semibold text-foreground">
                              {order.orderNumber}
                            </td>

                            <td className="px-4 py-4">
                              <p className="font-medium text-foreground">
                                {order.customer?.name ||
                                  t("userOrders.unknown")}
                              </p>

                              <p className="mt-1 text-xs text-muted-foreground">
                                {order.customer?.phone ||
                                  t("userOrders.noPhone")}
                              </p>
                            </td>

                            <td className="px-4 py-4 text-muted-foreground">
                              {order.items?.reduce(
                                (sum, item) => sum + item.quantity,
                                0,
                              ) || 0}{" "}
                              {t("userOrders.items")}
                            </td>

                            <td className="px-4 py-4 font-semibold text-foreground">
                              {formatCurrency(order.total, locale)}
                            </td>

                            <td className="px-4 py-4">
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                                  order.paymentStatus,
                                )}`}
                              >
                                {translatePaymentStatus(order.paymentStatus)}
                              </span>
                            </td>

                            <td className="px-4 py-4">
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                                  order.status,
                                )}`}
                              >
                                {translateOrderStatus(order.status)}
                              </span>
                            </td>

                            <td className="px-4 py-4 text-xs text-muted-foreground">
                              {formatDate(order.createdAt, locale)}
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex items-center justify-end gap-2">
                                {order.status === "PENDING" && (
                                  <button
                                    type="button"
                                    disabled={isUpdating || !!updatingOrderId}
                                    onClick={() =>
                                      setSelectedApproveOrder(order)
                                    }
                                    className="group inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 shadow-sm transition-all duration-200 hover:border-emerald-500 hover:bg-emerald-600 hover:text-white hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-600 dark:hover:text-white"
                                  >
                                    <CheckCircle2
                                      size={14}
                                      className="transition-transform group-hover:scale-110"
                                    />
                                    {t("userOrders.approve")}
                                  </button>
                                )}

                                {order.paymentStatus === "UNPAID" &&
                                  order.status !== "CANCELLED" && (
                                    <button
                                      type="button"
                                      disabled={isUpdating || !!updatingOrderId}
                                      onClick={() =>
                                        setSelectedPaymentOrder(order)
                                      }
                                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400"
                                    >
                                      <CreditCard size={13} />
                                      {t("userOrders.confirmPayment")}
                                    </button>
                                  )}

                                <Link
                                  href={`/admin/user-orders/${encodeURIComponent(
                                    order.orderNumber,
                                  )}`}
                                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium transition hover:border-emerald-500 hover:bg-emerald-500/5 hover:text-emerald-600 dark:border-gray-700"
                                >
                                  <Eye size={14} />
                                  {t("userOrders.view")}
                                  <ChevronRight size={14} />
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* MOBILE CARDS */}
                <div className="grid gap-3 p-3 md:hidden">
                  {orders.map((order) => {
                    const isUpdating = updatingOrderId === order.orderNumber;

                    return (
                      <div
                        key={order._id || order.orderNumber}
                        className="rounded-lg border border-gray-200 p-3 dark:border-gray-800"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground">
                              {order.orderNumber}
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                              {order.customer?.name || t("userOrders.unknown")}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              {order.customer?.phone || t("userOrders.noPhone")}
                            </p>
                          </div>

                          <span
                            className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${statusClass(
                              order.status,
                            )}`}
                          >
                            {translateOrderStatus(order.status)}
                          </span>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-3 border-t border-gray-100 pt-3 dark:border-gray-800">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              {t("userOrders.total")}
                            </p>

                            <p className="font-bold text-foreground">
                              {formatCurrency(order.total, locale)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground">
                              {t("userOrders.payment")}
                            </p>

                            <span
                              className={`mt-1 inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${statusClass(
                                order.paymentStatus,
                              )}`}
                            >
                              {translatePaymentStatus(order.paymentStatus)}
                            </span>
                          </div>
                        </div>

                        <p className="mt-3 text-xs text-muted-foreground">
                          {formatDate(order.createdAt, locale)}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
                          {order.status === "PENDING" && (
                            <button
                              type="button"
                              disabled={isUpdating || !!updatingOrderId}
                              onClick={() => setSelectedApproveOrder(order)}
                              className="group inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 shadow-sm transition-all duration-200 hover:border-emerald-500 hover:bg-emerald-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-600 dark:hover:text-white"
                            >
                              <CheckCircle2
                                size={14}
                                className="transition-transform group-hover:scale-110"
                              />
                              {t("userOrders.approve")}
                            </button>
                          )}

                          {order.paymentStatus === "UNPAID" &&
                            order.status !== "CANCELLED" && (
                              <button
                                type="button"
                                disabled={isUpdating || !!updatingOrderId}
                                onClick={() => setSelectedPaymentOrder(order)}
                                className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400"
                              >
                                <CreditCard size={13} />
                                {t("userOrders.confirmPayment")}
                              </button>
                            )}

                          <Link
                            href={`/admin/user-orders/${encodeURIComponent(
                              order.orderNumber,
                            )}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium hover:border-emerald-500 hover:text-emerald-600 dark:border-gray-700"
                          >
                            <Eye size={14} />
                            {t("userOrders.viewOrder")}
                            <ChevronRight size={14} />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* ORDER COUNT */}
            <div className="border-t border-gray-200 px-4 py-3 text-xs text-muted-foreground dark:border-gray-800">
              {t("userOrders.showingOrders", {
                count: orders.length,
              })}
            </div>
          </section>
        </div>
      </div>

      {/* =====================================
          APPROVE ORDER MODAL
      ===================================== */}

      <Dialog
        open={!!selectedApproveOrder}
        onOpenChange={(open) => {
          if (!open && !updatingOrderId) {
            setSelectedApproveOrder(null);
          }
        }}
      >
        <DialogContent className="max-w-md overflow-hidden rounded-2xl border-0 p-0">
          {selectedApproveOrder && (
            <>
              <div className="bg-gradient-to-br from-emerald-600 to-teal-700 px-6 py-7 text-white">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/15 shadow-lg">
                  <CheckCircle2 size={32} />
                </div>

                <DialogHeader className="mt-4 text-center">
                  <DialogTitle className="text-xl font-bold text-white">
                    {t("userOrders.approveCustomerOrder")}
                  </DialogTitle>

                  <DialogDescription className="mt-2 text-sm text-emerald-50">
                    {t("userOrders.approveDescription")}
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="space-y-4 p-6">
                <div className="rounded-xl border bg-muted/30 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-muted-foreground">
                      {t("userOrders.orderNumber")}
                    </span>

                    <span className="font-semibold text-foreground">
                      {selectedApproveOrder.orderNumber}
                    </span>
                  </div>

                  <div className="my-3 border-t" />

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-muted-foreground">
                      {t("userOrders.customer")}
                    </span>

                    <span className="text-right text-sm font-medium text-foreground">
                      {selectedApproveOrder.customer?.name ||
                        t("userOrders.unknown")}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-sm text-muted-foreground">
                      {t("userOrders.totalAmount")}
                    </span>

                    <span className="text-lg font-bold text-foreground">
                      {formatCurrency(selectedApproveOrder.total, locale)}
                    </span>
                  </div>

                  <div className="my-3 border-t" />

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-muted-foreground">
                      {t("userOrders.currentStatus")}
                    </span>

                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                      {translateOrderStatus("PENDING")}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-sm text-muted-foreground">
                      {t("userOrders.newStatus")}
                    </span>

                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                      {translateOrderStatus("CONFIRMED")}
                    </span>
                  </div>
                </div>

                {/* APPROVAL NOTICE */}
                <div className="flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/30">
                  <div className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400">
                    <AlertCircle size={20} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-blue-800 dark:text-blue-400">
                      {t("userOrders.approvalNotice")}
                    </p>

                    <p className="mt-1 text-xs leading-relaxed text-blue-700 dark:text-blue-500">
                      {t("userOrders.approvalNoticeDescription")}
                    </p>
                  </div>
                </div>

                <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    disabled={isApproveUpdating}
                    onClick={() => setSelectedApproveOrder(null)}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-background px-5 text-sm font-semibold text-foreground transition hover:bg-accent disabled:opacity-50 dark:border-gray-700"
                  >
                    <X size={16} />
                    {t("common.cancel")}
                  </button>

                  <button
                    type="button"
                    disabled={!!updatingOrderId}
                    onClick={() => {
                      void updateOrder(selectedApproveOrder, {
                        status: "CONFIRMED",
                      });
                    }}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isApproveUpdating ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        {t("userOrders.approving")}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={17} />
                        {t("userOrders.yesApproveOrder")}
                      </>
                    )}
                  </button>
                </DialogFooter>

                <p className="text-center text-[11px] text-muted-foreground">
                  {t("userOrders.reviewBeforeApproving")}
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* =====================================
          CONFIRM PAYMENT MODAL
      ===================================== */}

      <Dialog
        open={!!selectedPaymentOrder}
        onOpenChange={(open) => {
          if (!open && !updatingOrderId) {
            setSelectedPaymentOrder(null);
          }
        }}
      >
        <DialogContent className="max-w-md overflow-hidden rounded-2xl border-0 p-0">
          {selectedPaymentOrder && (
            <>
              <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 px-6 py-7 text-white">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/15 shadow-lg">
                  <CreditCard size={30} />
                </div>

                <DialogHeader className="mt-4 text-center">
                  <DialogTitle className="text-xl font-bold text-white">
                    {t("userOrders.confirmPayment")}
                  </DialogTitle>

                  <DialogDescription className="mt-2 text-sm text-emerald-50">
                    {t("userOrders.confirmPaymentDescription")}
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="space-y-4 p-6">
                <div className="rounded-xl border bg-muted/30 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-muted-foreground">
                      {t("userOrders.orderNumber")}
                    </span>

                    <span className="text-right font-semibold text-foreground">
                      {selectedPaymentOrder.orderNumber}
                    </span>
                  </div>

                  <div className="my-3 border-t" />

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-muted-foreground">
                      {t("userOrders.customer")}
                    </span>

                    <span className="text-right text-sm font-medium text-foreground">
                      {selectedPaymentOrder.customer?.name ||
                        t("userOrders.unknown")}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-sm text-muted-foreground">
                      {t("userOrders.phone")}
                    </span>

                    <span className="text-right text-sm font-medium text-foreground">
                      {selectedPaymentOrder.customer?.phone ||
                        t("userOrders.noPhone")}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-sm text-muted-foreground">
                      {t("userOrders.paymentMethod")}
                    </span>

                    <span className="text-right text-sm font-medium text-foreground">
                      {translatePaymentMethod(
                        selectedPaymentOrder.paymentMethod,
                      )}
                    </span>
                  </div>

                  <div className="my-3 border-t" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      {t("userOrders.totalAmount")}
                    </span>

                    <span className="text-2xl font-bold text-emerald-600">
                      {formatCurrency(selectedPaymentOrder.total, locale)}
                    </span>
                  </div>
                </div>

                {/* PAYMENT VERIFICATION NOTICE */}
                <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30">
                  <div className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400">
                    <ShieldCheck size={20} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">
                      {t("userOrders.paymentVerificationRequired")}
                    </p>

                    <p className="mt-1 text-xs leading-relaxed text-amber-700 dark:text-amber-500">
                      {t("userOrders.paymentVerificationDescription", {
                        amount: formatCurrency(
                          selectedPaymentOrder.total,
                          locale,
                        ),
                      })}
                    </p>
                  </div>
                </div>

                <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    disabled={isPaymentUpdating}
                    onClick={() => setSelectedPaymentOrder(null)}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-background px-5 text-sm font-semibold text-foreground transition hover:bg-accent disabled:opacity-50 dark:border-gray-700"
                  >
                    <X size={16} />
                    {t("common.cancel")}
                  </button>

                  <button
                    type="button"
                    disabled={!!updatingOrderId}
                    onClick={() => {
                      void updateOrder(selectedPaymentOrder, {
                        paymentStatus: "PAID",
                      });
                    }}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPaymentUpdating ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        {t("userOrders.processing")}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={17} />
                        {t("userOrders.confirmPayment")}
                      </>
                    )}
                  </button>
                </DialogFooter>

                <p className="text-center text-[11px] text-muted-foreground">
                  {t("userOrders.doubleCheckPayment")}
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}

/* =========================================
   SUMMARY CARD
========================================= */

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-background p-4 dark:border-gray-800">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{title}</p>

        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
          {icon}
        </div>
      </div>

      <p className="mt-3 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

/* =========================================
   PAGE
========================================= */

export default function UserOrdersPage() {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background">
        <DashboardContent />
      </div>
    </SidebarProvider>
  );
}
