import type { PaymentGateway } from "@/types/transaction";

// Legacy event names kept for existing components.
// These events do not store transactions in localStorage.
export const TRANSACTION_CREATED_EVENT = "transaction:created";
export const TRANSACTION_UPDATED_EVENT = "transaction:updated";
export const TRANSACTION_DELETED_EVENT = "transaction:deleted";

const PAYMENT_METHOD_LABELS: Record<PaymentGateway, string> = {
  CASH: "Cash",
  CARD: "Credit / Debit Card",
  ABA: "ABA Bank",
  ACLEDA: "ACLEDA Bank",
  KHQR: "KHQR",
  PAYPAL: "PayPal",
  STRIPE: "Stripe",
};

export function getPaymentMethodLabel(method: PaymentGateway | string): string {
  return PAYMENT_METHOD_LABELS[method as PaymentGateway] || method || "Unknown";
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
}

export function formatTransactionDate(
  date: string | Date | null | undefined,
): string {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsedDate);
}

export function formatTransactionShortDate(
  date: string | Date | null | undefined,
): string {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(parsedDate);
}
