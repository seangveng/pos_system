import type { Transaction } from "@/types/transaction";

export type AnalyticsPeriod = "7" | "30" | "90";

export interface RevenuePoint {
  label: string;
  revenue: number;
  transactions: number;
}

export interface CategoryData {
  name: string;
  amount: number;
  percentage: number;
}

export interface PaymentMethodData {
  name: string;
  gateway: Transaction["gateway"];
  amount: number;
  count: number;
  percentage: number;
}

export interface ProductPerformance {
  id: string | number;
  name: string;
  quantity: number;
  revenue: number;
  percentage: number;
}

export function getPeriodStart(period: AnalyticsPeriod) {
  const date = new Date();

  date.setHours(0, 0, 0, 0);

  date.setDate(date.getDate() - (Number(period) - 1));

  return date;
}

export function filterTransactionsByPeriod(
  transactions: Transaction[],
  period: AnalyticsPeriod,
) {
  const startDate = getPeriodStart(period);

  return transactions.filter((transaction) => {
    const createdAt = new Date(transaction.createdAt);

    return createdAt >= startDate;
  });
}

export function getPaidTransactions(transactions: Transaction[]) {
  return transactions.filter((transaction) => transaction.status === "PAID");
}

export function getRevenue(transactions: Transaction[]) {
  return getPaidTransactions(transactions).reduce(
    (total, transaction) => total + Number(transaction.total || 0),
    0,
  );
}

export function getAverageOrderValue(transactions: Transaction[]) {
  const paidTransactions = getPaidTransactions(transactions);

  if (paidTransactions.length === 0) {
    return 0;
  }

  return getRevenue(transactions) / paidTransactions.length;
}

export function getRefundAmount(transactions: Transaction[]) {
  return transactions
    .filter((transaction) => transaction.status === "REFUNDED")
    .reduce((total, transaction) => total + Number(transaction.total || 0), 0);
}

/* =========================================================
   REVENUE BY DAY
========================================================= */

export function getRevenueByDay(
  transactions: Transaction[],
  period: AnalyticsPeriod,
): RevenuePoint[] {
  const days = Number(period);

  const result: RevenuePoint[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();

    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - i);

    const nextDate = new Date(date);

    nextDate.setDate(nextDate.getDate() + 1);

    const dayTransactions = getPaidTransactions(transactions).filter(
      (transaction) => {
        const createdAt = new Date(transaction.createdAt);

        return createdAt >= date && createdAt < nextDate;
      },
    );

    const revenue = dayTransactions.reduce(
      (total, transaction) => total + Number(transaction.total || 0),
      0,
    );

    result.push({
      label:
        days <= 7
          ? date.toLocaleDateString("en-US", {
              weekday: "short",
            })
          : date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
      revenue,
      transactions: dayTransactions.length,
    });
  }

  return result;
}

/* =========================================================
   CATEGORY PERFORMANCE
========================================================= */

export function getCategoryPerformance(
  transactions: Transaction[],
): CategoryData[] {
  const paidTransactions = getPaidTransactions(transactions);

  const categoryMap = new Map<string, number>();

  paidTransactions.forEach((transaction) => {
    transaction.items.forEach((item) => {
      const category = item.category || "Uncategorized";

      const amount = Number(item.price || 0) * Number(item.quantity || 0);

      categoryMap.set(category, (categoryMap.get(category) || 0) + amount);
    });
  });

  const total = Array.from(categoryMap.values()).reduce(
    (sum, amount) => sum + amount,
    0,
  );

  return Array.from(categoryMap.entries())
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);
}

/* =========================================================
   PAYMENT METHODS
========================================================= */

export function getPaymentMethods(
  transactions: Transaction[],
): PaymentMethodData[] {
  const paidTransactions = getPaidTransactions(transactions);

  const methodMap = new Map<
    string,
    {
      gateway: Transaction["gateway"];
      amount: number;
      count: number;
    }
  >();

  paidTransactions.forEach((transaction) => {
    const existing = methodMap.get(transaction.gateway);

    if (existing) {
      existing.amount += Number(transaction.total || 0);

      existing.count += 1;
    } else {
      methodMap.set(transaction.gateway, {
        gateway: transaction.gateway,
        amount: Number(transaction.total || 0),
        count: 1,
      });
    }
  });

  const total = Array.from(methodMap.values()).reduce(
    (sum, item) => sum + item.amount,
    0,
  );

  return Array.from(methodMap.values())
    .map((item) => ({
      name: getGatewayLabel(item.gateway),
      gateway: item.gateway,
      amount: item.amount,
      count: item.count,
      percentage: total > 0 ? (item.amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

/* =========================================================
   TOP PRODUCTS
========================================================= */

export function getTopProducts(
  transactions: Transaction[],
): ProductPerformance[] {
  const paidTransactions = getPaidTransactions(transactions);

  const productMap = new Map<
    string,
    {
      id: string | number;
      name: string;
      quantity: number;
      revenue: number;
    }
  >();

  paidTransactions.forEach((transaction) => {
    transaction.items.forEach((item) => {
      const key = String(item.id);

      const existing = productMap.get(key);

      const revenue = Number(item.price || 0) * Number(item.quantity || 0);

      if (existing) {
        existing.quantity += Number(item.quantity || 0);

        existing.revenue += revenue;
      } else {
        productMap.set(key, {
          id: item.id,
          name: item.name,
          quantity: Number(item.quantity || 0),
          revenue,
        });
      }
    });
  });

  const products = Array.from(productMap.values()).sort(
    (a, b) => b.revenue - a.revenue,
  );

  const total = products.reduce((sum, product) => sum + product.revenue, 0);

  return products.slice(0, 5).map((product) => ({
    ...product,
    percentage: total > 0 ? (product.revenue / total) * 100 : 0,
  }));
}

/* =========================================================
   HELPERS
========================================================= */

export function getGatewayLabel(gateway: Transaction["gateway"]) {
  switch (gateway) {
    case "CASH":
      return "Cash";

    case "CARD":
      return "Card";

    case "ABA":
      return "ABA Bank";

    case "ACLEDA":
      return "ACLEDA";

    case "KHQR":
      return "KHQR";

    case "PAYPAL":
      return "PayPal";

    case "STRIPE":
      return "Stripe";

    default:
      return gateway;
  }
}

export function formatAnalyticsCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}
