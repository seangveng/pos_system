"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  RefreshCw,
  Package,
  MapPin,
  Phone,
  User,
  CreditCard,
  CalendarDays,
  FileText,
  Save,
  CheckCircle2,
} from "lucide-react";

import { useSidebar, SidebarProvider } from "@/contexts/sidebar-contexts";

import { Sidebar } from "../../orders/_component/leftside-bar";

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
    sku?: string;
    category?: string;
    price: number;
    quantity: number;
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
  paidAt?: string | null;
  status: OrderStatus;
  createdAt: string;
  updatedAt?: string;
  cancelledAt?: string | null;
  stockRestoredAt?: string | null;
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value || 0);
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

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

function DetailCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-gray-200 bg-background dark:border-gray-800">
      <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3 dark:border-gray-800">
        <span className="text-emerald-600">{icon}</span>
        <h2 className="font-semibold text-foreground">{title}</h2>
      </div>

      <div className="p-4">{children}</div>
    </section>
  );
}

function DashboardContent() {
  const { isCollapsed } = useSidebar();
  const params = useParams<{ id: string }>();

  const orderNumber = params.id;

  const [order, setOrder] = useState<Order | null>(null);

  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>("PENDING");

  const [selectedPaymentStatus, setSelectedPaymentStatus] =
    useState<PaymentStatus>("UNPAID");

  const [loading, setLoading] = useState(true);
  const [savingOrder, setSavingOrder] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch order
  const fetchOrder = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/orders/${encodeURIComponent(orderNumber)}`,
          {
            method: "GET",
            cache: "no-store",
            signal,
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load order");
        }

        setOrder(data.order);
        setSelectedStatus(data.order.status);
        setSelectedPaymentStatus(data.order.paymentStatus);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    [orderNumber],
  );

  useEffect(() => {
    const controller = new AbortController();

    void fetchOrder(controller.signal);

    return () => controller.abort();
  }, [fetchOrder]);

  // Update order or payment independently
  async function updateOrder(payload: {
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
  }) {
    if (savingOrder || savingPayment) return;

    const isPaymentUpdate = Boolean(payload.paymentStatus);

    if (isPaymentUpdate) {
      setSavingPayment(true);
    } else {
      setSavingOrder(true);
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/orders/${encodeURIComponent(orderNumber)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to update order");
      }

      setOrder(data.order);
      setSelectedStatus(data.order.status);
      setSelectedPaymentStatus(data.order.paymentStatus);

      setSuccess(
        payload.status === "CONFIRMED"
          ? "Customer order approved successfully."
          : payload.paymentStatus === "PAID"
            ? "Customer payment confirmed successfully."
            : "Order updated successfully.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update order");
    } finally {
      setSavingOrder(false);
      setSavingPayment(false);
    }
  }

  // Quick approve action
  function handleApproveOrder() {
    if (!order || order.status !== "PENDING") return;

    const confirmed = window.confirm(
      `Approve customer order ${order.orderNumber}?`,
    );

    if (!confirmed) return;

    void updateOrder({ status: "CONFIRMED" });
  }

  // Quick confirm payment action
  function handleConfirmPayment() {
    if (!order || order.paymentStatus !== "UNPAID") return;
    if (order.status === "CANCELLED") return;

    const confirmed = window.confirm(
      `Confirm that the customer has paid ${formatCurrency(order.total)}?`,
    );

    if (!confirmed) return;

    void updateOrder({ paymentStatus: "PAID" });
  }

  // Save order status
  function handleSaveOrderStatus() {
    if (!order || selectedStatus === order.status) return;

    if (selectedStatus === "CANCELLED") {
      if (order.paymentStatus === "PAID") {
        setError(
          "Please refund and save the payment before cancelling this paid order.",
        );
        return;
      }

      const confirmed = window.confirm(
        "Are you sure you want to cancel this order? Tracked product stock will be restored once.",
      );

      if (!confirmed) return;
    }

    void updateOrder({ status: selectedStatus });
  }

  // Save payment status
  function handleSavePaymentStatus() {
    if (!order || selectedPaymentStatus === order.paymentStatus) {
      return;
    }

    if (selectedPaymentStatus === "REFUNDED") {
      if (order.paymentStatus !== "PAID") {
        setError("Only paid orders can be refunded.");
        return;
      }

      const confirmed = window.confirm(
        "Confirm that this customer payment has actually been refunded?",
      );

      if (!confirmed) return;
    }

    void updateOrder({
      paymentStatus: selectedPaymentStatus,
    });
  }

  if (loading) {
    return (
      <main>
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw size={18} className="animate-spin" />
            Loading order details...
          </div>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main>
        <div className="min-h-screen bg-background p-4">
          <div className="mx-auto max-w-3xl rounded-lg border border-gray-200 bg-background p-6 dark:border-gray-800">
            <p className="font-semibold text-foreground">Order not found</p>

            <p className="mt-1 text-sm text-muted-foreground">
              {error || "This order may have been deleted."}
            </p>

            <Link
              href="/admin/user-orders"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
            >
              <ArrowLeft size={16} />
              Back to User Orders
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const totalQuantity = order.items.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  const isCancelled = order.status === "CANCELLED";
  const isRefunded = order.paymentStatus === "REFUNDED";
  const isBusy = savingOrder || savingPayment;

  return (
    <main>
      <div className="min-h-screen bg-background ">
        <div className="rounded-lg border border-gray-200 bg-accent/50 p-2 sm:p-3 dark:border-gray-800">
          {/* Header */}
          <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-background p-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
            <div className="flex items-center gap-3">
              <Link
                href="/admin/user-orders"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 transition hover:bg-accent dark:border-gray-700"
                aria-label="Back to user orders"
              >
                <ArrowLeft size={18} />
              </Link>

              <div>
                <p className="text-xs text-muted-foreground">
                  User Orders / Order Details
                </p>

                <h1 className="mt-1 text-lg font-bold text-foreground">
                  {order.orderNumber}
                </h1>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void fetchOrder()}
              disabled={loading || isBusy}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium transition hover:bg-accent disabled:opacity-50 dark:border-gray-700"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh Order
            </button>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400">
              {success}
            </div>
          )}

          {/* Status Summary */}
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-background p-4 dark:border-gray-800">
              <p className="text-xs text-muted-foreground">Order Status</p>

              <span
                className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass(order.status)}`}
              >
                {order.status}
              </span>
            </div>

            <div className="rounded-lg border border-gray-200 bg-background p-4 dark:border-gray-800">
              <p className="text-xs text-muted-foreground">Payment Status</p>

              <span
                className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass(order.paymentStatus)}`}
              >
                {order.paymentStatus}
              </span>
            </div>

            <div className="rounded-lg border border-gray-200 bg-background p-4 dark:border-gray-800">
              <p className="text-xs text-muted-foreground">Order Total</p>

              <p className="mt-2 text-xl font-bold text-foreground">
                {formatCurrency(order.total)}
              </p>
            </div>
          </div>

          {/* Quick Staff Actions */}
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {order.status === "PENDING" && (
              <button
                type="button"
                onClick={handleApproveOrder}
                disabled={isBusy}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingOrder ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={18} />
                )}
                Approve Customer Order
              </button>
            )}

            {order.paymentStatus === "UNPAID" && !isCancelled && (
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={isBusy}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingPayment ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <CreditCard size={18} />
                )}
                Confirm Customer Payment
              </button>
            )}
          </div>

          {/* Main Content */}
          <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-3">
            {/* Left Column */}
            <div className="space-y-3 xl:col-span-2">
              {/* Products */}
              <DetailCard title="Ordered Products" icon={<Package size={18} />}>
                <div className="space-y-3">
                  {order.items.map((item, index) => (
                    <div
                      key={`${item.productId}-${index}`}
                      className="flex items-center gap-3 border-b border-gray-100 pb-3 last:border-0 last:pb-0 dark:border-gray-800"
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-16 w-16 rounded-lg border border-gray-200 object-cover dark:border-gray-700"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-accent">
                          <Package
                            size={23}
                            className="text-muted-foreground"
                          />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground">
                          {item.name}
                        </p>

                        {item.sku && (
                          <p className="text-xs text-muted-foreground">
                            SKU: {item.sku}
                          </p>
                        )}

                        {(item.size || item.color) && (
                          <p className="text-xs text-muted-foreground">
                            {[item.size, item.color]
                              .filter(Boolean)
                              .join(" / ")}
                          </p>
                        )}

                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatCurrency(item.price)} × {item.quantity}
                        </p>
                      </div>

                      <p className="shrink-0 font-semibold text-foreground">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Price Summary */}
                <div className="mt-4 space-y-2 border-t border-gray-200 pt-4 text-sm dark:border-gray-800">
                  <PriceRow label="Total Items" value={String(totalQuantity)} />

                  <PriceRow
                    label="Subtotal"
                    value={formatCurrency(order.subtotal)}
                  />

                  <PriceRow
                    label="Discount"
                    value={`-${formatCurrency(order.discount)}`}
                  />

                  {order.promoCode && (
                    <PriceRow
                      label={`Promo Code (${order.promoCode})`}
                      value="Applied"
                    />
                  )}

                  <PriceRow label="Tax" value={formatCurrency(order.tax)} />

                  <PriceRow
                    label="Delivery Fee"
                    value={formatCurrency(order.deliveryFee)}
                  />

                  <div className="flex items-center justify-between border-t border-gray-200 pt-3 text-base font-bold dark:border-gray-800">
                    <span>Total</span>

                    <span className="text-emerald-600">
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                </div>
              </DetailCard>

              {/* Customer Information */}
              <DetailCard
                title="Customer Information"
                icon={<User size={18} />}
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <InfoItem
                    label="Customer Name"
                    value={order.customer?.name || "—"}
                    icon={<User size={16} />}
                  />

                  <InfoItem
                    label="Phone Number"
                    value={order.customer?.phone || "—"}
                    icon={<Phone size={16} />}
                  />

                  <InfoItem
                    label="Delivery Address"
                    value={order.customer?.address || "—"}
                    icon={<MapPin size={16} />}
                  />

                  <InfoItem
                    label="Customer Notes"
                    value={order.customer?.notes || "No notes"}
                    icon={<FileText size={16} />}
                  />
                </div>
              </DetailCard>
            </div>

            {/* Right Column */}
            <div className="space-y-3">
              {/* Payment Information */}
              <DetailCard
                title="Payment Information"
                icon={<CreditCard size={18} />}
              >
                <div className="space-y-4">
                  <InfoItem
                    label="Payment Method"
                    value={order.paymentMethod}
                    icon={<CreditCard size={16} />}
                  />

                  <InfoItem
                    label="Payment Status"
                    value={order.paymentStatus}
                    icon={<CreditCard size={16} />}
                  />

                  <InfoItem
                    label="Paid At"
                    value={formatDate(order.paidAt)}
                    icon={<CalendarDays size={16} />}
                  />

                  <div>
                    <label className="mb-2 block text-xs font-medium text-muted-foreground">
                      Update Payment Status
                    </label>

                    <select
                      value={selectedPaymentStatus}
                      disabled={isRefunded || isCancelled || isBusy}
                      onChange={(event) =>
                        setSelectedPaymentStatus(
                          event.target.value as PaymentStatus,
                        )
                      }
                      className="h-10 w-full rounded-lg border border-gray-200 bg-background px-3 text-sm outline-none focus:border-emerald-500 disabled:opacity-50 dark:border-gray-700"
                    >
                      {PAYMENT_STATUSES.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={handleSavePaymentStatus}
                      disabled={
                        isBusy ||
                        isRefunded ||
                        isCancelled ||
                        selectedPaymentStatus === order.paymentStatus
                      }
                      className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {savingPayment ? (
                        <RefreshCw size={15} className="animate-spin" />
                      ) : (
                        <Save size={15} />
                      )}
                      Save Payment
                    </button>
                  </div>
                </div>
              </DetailCard>

              {/* Manage Order */}
              <DetailCard title="Manage Order" icon={<Package size={18} />}>
                <div>
                  <label className="mb-2 block text-xs font-medium text-muted-foreground">
                    Update Order Status
                  </label>

                  <select
                    value={selectedStatus}
                    disabled={isCancelled || isBusy}
                    onChange={(event) =>
                      setSelectedStatus(event.target.value as OrderStatus)
                    }
                    className="h-10 w-full rounded-lg border border-gray-200 bg-background px-3 text-sm outline-none focus:border-emerald-500 disabled:opacity-50 dark:border-gray-700"
                  >
                    {ORDER_STATUSES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleSaveOrderStatus}
                    disabled={
                      isBusy || isCancelled || selectedStatus === order.status
                    }
                    className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingOrder ? (
                      <RefreshCw size={15} className="animate-spin" />
                    ) : (
                      <Save size={15} />
                    )}
                    Save Order Status
                  </button>
                </div>

                {isCancelled && (
                  <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-400">
                    This order is cancelled and cannot be reopened.
                  </p>
                )}

                {order.stockRestoredAt && (
                  <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                    Tracked product stock was restored on{" "}
                    {formatDate(order.stockRestoredAt)}.
                  </p>
                )}

                {isCancelled && !order.stockRestoredAt && (
                  <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                    No stock restoration timestamp is recorded for this order.
                  </p>
                )}
              </DetailCard>

              {/* Order Information */}
              <DetailCard
                title="Order Information"
                icon={<FileText size={18} />}
              >
                <div className="space-y-3">
                  <InfoItem label="Order Number" value={order.orderNumber} />

                  <InfoItem label="Order Source" value={order.orderSource} />

                  <InfoItem
                    label="Created At"
                    value={formatDate(order.createdAt)}
                  />

                  <InfoItem
                    label="Last Updated"
                    value={formatDate(order.updatedAt)}
                  />

                  <InfoItem
                    label="Cancelled At"
                    value={formatDate(order.cancelledAt)}
                  />
                </div>
              </DetailCard>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-muted-foreground">
      <span>{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function InfoItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-medium text-foreground">
        {value}
      </p>
    </div>
  );
}

export default function UserOrderDetailPage() {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background">
        <DashboardContent />
      </div>
    </SidebarProvider>
  );
}
