"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUp,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Download,
  Search,
  ShoppingBag,
  TrendingUp,
  RefreshCw,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import type { Transaction } from "@/types/transaction";

import { getPaymentMethodLabel, formatCurrency } from "@/lib/transactions";

import { useTranslation } from "@/hooks/use-translation";

const ITEMS_PER_PAGE = 8;

const donutColors = [
  "#047857",
  "#14b8a6",
  "#06b6d4",
  "#f59e0b",
  "#cbd5e1",
  "#8b5cf6",
  "#f43f5e",
];

type TransactionWithPaymentStatus = Transaction & {
  paymentStatus?: string;
  orderStatus?: string;
};

type Locale = "en" | "km";

const KHMER_WEEKDAYS = [
  "ថ្ងៃអាទិត្យ",
  "ថ្ងៃចន្ទ",
  "ថ្ងៃអង្គារ",
  "ថ្ងៃពុធ",
  "ថ្ងៃព្រហស្បតិ៍",
  "ថ្ងៃសុក្រ",
  "ថ្ងៃសៅរ៍",
];

const KHMER_MONTHS = [
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

const KHMER_NUMBERS: Record<string, string> = {
  "0": "០",
  "1": "១",
  "2": "២",
  "3": "៣",
  "4": "៤",
  "5": "៥",
  "6": "៦",
  "7": "៧",
  "8": "៨",
  "9": "៩",
};

/* =========================================================
   TRANSLATIONS
========================================================= */

const translations = {
  en: {
    title: "Transactions",
    subtitle: "Monitor and manage your payment transactions",
    dateRange: "Date Range",
    exportCSV: "Export CSV",
    last30Days: "Last 30 Days",
    today: "Today",
    yesterday: "Yesterday",
    last7Days: "Last 7 Days",
    thisMonth: "This Month",
    allTime: "All Time",

    totalTransactions: "Total Transactions",
    paid: "Paid",
    totalSpent: "Total Spent",
    avgPerDay: "Avg. per Day",
    daily: "Daily",

    search: "Search transactions...",
    category: "Category",
    status: "Status",
    amount: "Amount",

    dateTime: "Date & Time",
    description: "Description",
    account: "Account",

    loadingTransactions: "Loading transactions...",
    connectingMongoDB: "Connecting to MongoDB",
    unableToLoad: "Unable to load transactions",
    tryAgain: "Try Again",
    noTransactions: "No transactions found",
    noTransactionsMatch: "No transactions match your filters.",
    transactionsUnavailable: "Transactions unavailable",
    showing: "Showing",
    of: "of",
    transactions: "transactions",
    previous: "Previous",
    next: "Next",

    spendingByCategory: "Spending by Category",
    total: "Total",
    noSpendingData: "No spending data",

    topMerchants: "Top Merchants",
    noMerchantData: "No merchant data",
    transaction: "transaction",
    transactionPlural: "transactions",

    paymentMethods: "Payment Methods",
    payments: "payments",
    qrPayment: "QR Payment",
    close: "Close",
    scanToPay: "Scan to pay using",

    allCategories: "All Categories",
    allStatuses: "All Statuses",
    allAmounts: "All Amounts",
    under50: "Under $50",
    between50And100: "$50 - $100",
    over100: "Over $100",

    invalidDate: "Invalid date",

    statuses: {
      PAID: "Paid",
      PENDING: "Pending",
      FAILED: "Failed",
      REFUNDED: "Refunded",
      CANCELLED: "Cancelled",
    },

    methods: {
      CASH: "Cash",
      ABA: "ABA",
      ACLEDA: "ACLEDA",
      KHQR: "KHQR",
      CARD: "Card",
      PAYPAL: "PayPal",
      STRIPE: "Stripe",
    },
  },

  km: {
    title: "ប្រតិបត្តិការទូទាត់",
    subtitle: "តាមដាន និងគ្រប់គ្រងប្រតិបត្តិការទូទាត់របស់អ្នក",
    dateRange: "ចន្លោះកាលបរិច្ឆេទ",
    exportCSV: "នាំចេញ CSV",
    last30Days: "៣០ ថ្ងៃចុងក្រោយ",
    today: "ថ្ងៃនេះ",
    yesterday: "ម្សិលមិញ",
    last7Days: "៧ ថ្ងៃចុងក្រោយ",
    thisMonth: "ខែនេះ",
    allTime: "គ្រប់ពេលវេលា",

    totalTransactions: "ប្រតិបត្តិការសរុប",
    paid: "បានបង់ប្រាក់",
    totalSpent: "ទឹកប្រាក់សរុប",
    avgPerDay: "មធ្យមក្នុងមួយថ្ងៃ",
    daily: "ប្រចាំថ្ងៃ",

    search: "ស្វែងរកប្រតិបត្តិការ...",
    category: "ប្រភេទ",
    status: "ស្ថានភាព",
    amount: "ចំនួនទឹកប្រាក់",

    dateTime: "កាលបរិច្ឆេទ និងម៉ោង",
    description: "ព័ត៌មានលម្អិត",
    account: "គណនី",

    loadingTransactions: "កំពុងផ្ទុកប្រតិបត្តិការ...",
    connectingMongoDB: "កំពុងភ្ជាប់ទៅ MongoDB",
    unableToLoad: "មិនអាចផ្ទុកប្រតិបត្តិការបានទេ",
    tryAgain: "ព្យាយាមម្តងទៀត",
    noTransactions: "រកមិនឃើញប្រតិបត្តិការ",
    noTransactionsMatch: "មិនមានប្រតិបត្តិការដែលត្រូវនឹងការត្រងរបស់អ្នកទេ។",
    transactionsUnavailable: "មិនអាចបង្ហាញប្រតិបត្តិការបានទេ",
    showing: "កំពុងបង្ហាញ",
    of: "ក្នុងចំណោម",
    transactions: "ប្រតិបត្តិការ",
    previous: "មុន",
    next: "បន្ទាប់",

    spendingByCategory: "ការចំណាយតាមប្រភេទ",
    total: "សរុប",
    noSpendingData: "មិនមានទិន្នន័យចំណាយទេ",

    topMerchants: "អតិថិជនកំពូល",
    noMerchantData: "មិនមានទិន្នន័យអតិថិជនទេ",
    transaction: "ប្រតិបត្តិការ",
    transactionPlural: "ប្រតិបត្តិការ",

    paymentMethods: "វិធីសាស្ត្រទូទាត់",
    payments: "ការទូទាត់",
    qrPayment: "ការទូទាត់តាម QR",
    close: "បិទ",
    scanToPay: "ស្កេនដើម្បីបង់ប្រាក់តាម",

    allCategories: "គ្រប់ប្រភេទ",
    allStatuses: "គ្រប់ស្ថានភាព",
    allAmounts: "គ្រប់ចំនួនទឹកប្រាក់",
    under50: "ក្រោម $50",
    between50And100: "$50 - $100",
    over100: "លើស $100",

    invalidDate: "កាលបរិច្ឆេទមិនត្រឹមត្រូវ",

    statuses: {
      PAID: "បានបង់ប្រាក់",
      PENDING: "រង់ចាំការទូទាត់",
      FAILED: "បរាជ័យ",
      REFUNDED: "បានសងប្រាក់វិញ",
      CANCELLED: "បានបោះបង់",
    },

    methods: {
      CASH: "សាច់ប្រាក់",
      ABA: "ABA",
      ACLEDA: "ACLEDA",
      KHQR: "KHQR",
      CARD: "កាត",
      PAYPAL: "PayPal",
      STRIPE: "Stripe",
    },
  },
};

/* =========================================================
   CATEGORY TRANSLATIONS

   Database category values remain unchanged.
   Only display labels are translated.
========================================================= */

const KHMER_CATEGORIES: Record<string, string> = {
  beer: "ស្រាបៀ",
  beers: "ស្រាបៀ",
  drink: "ភេសជ្ជៈ",
  drinks: "ភេសជ្ជៈ",
  beverage: "ភេសជ្ជៈ",
  beverages: "ភេសជ្ជៈ",
  cake: "នំខេក",
  cakes: "នំខេក",
  bakery: "នំដុត",
  bread: "នំប៉័ង",
  breads: "នំប៉័ង",
  coffee: "កាហ្វេ",
  coffees: "កាហ្វេ",
  tea: "តែ",
  teas: "តែ",
  food: "អាហារ",
  foods: "អាហារ",
  snack: "អាហារសម្រន់",
  snacks: "អាហារសម្រន់",
  dessert: "បង្អែម",
  desserts: "បង្អែម",
  juice: "ទឹកផ្លែឈើ",
  juices: "ទឹកផ្លែឈើ",
  water: "ទឹក",
  waters: "ទឹក",
  milk: "ទឹកដោះគោ",
  milks: "ទឹកដោះគោ",
  other: "ផ្សេងៗ",
};

function translateCategory(category: string, locale: Locale): string {
  if (locale !== "km") return category;

  const normalized = category.trim().toLowerCase();

  return KHMER_CATEGORIES[normalized] || category;
}

/* =========================================================
   SAFE HELPERS
========================================================= */

function safeNumber(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const cleaned = value.replace(/[$,\s]/g, "").trim();

    if (!cleaned) return 0;

    const parsed = Number(cleaned);

    return Number.isFinite(parsed) ? parsed : 0;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function safeDate(value: unknown): Date | null {
  if (!value) return null;

  const date = new Date(String(value));

  return Number.isNaN(date.getTime()) ? null : date;
}

function safeFormatCurrency(value: unknown, currency = "USD"): string {
  return formatCurrency(safeNumber(value), currency);
}

function translateNumber(value: string): string {
  return value.replace(/[0-9]/g, (digit) => KHMER_NUMBERS[digit] || digit);
}

/* =========================================================
   KHMER DATE FORMATTER

   Uses Asia/Phnom_Penh so dates are displayed consistently
   with Cambodia local time.
========================================================= */

function getDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Phnom_Penh",
  }).formatToParts(date);

  return Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  ) as Record<string, string>;
}

function formatTransactionDateLocalized(
  value: unknown,
  locale: Locale,
): { date: string; time: string } {
  const date = safeDate(value);

  if (!date) {
    return {
      date: locale === "km" ? "កាលបរិច្ឆេទមិនត្រឹមត្រូវ" : "Invalid date",
      time: "--:--",
    };
  }

  const parts = getDateParts(date);

  if (locale === "km") {
    const weekdayIndex = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ].indexOf(parts.weekday);

    const monthIndex = Number(parts.month) - 1;

    const weekday = KHMER_WEEKDAYS[weekdayIndex] || "";
    const month = KHMER_MONTHS[monthIndex] || "";

    const day = translateNumber(parts.day || "");
    const year = translateNumber(parts.year || "");

    const hour = Number(parts.hour);
    const minute = translateNumber(parts.minute || "00");

    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const period = hour >= 12 ? "ល្ងាច" : "ព្រឹក";

    return {
      date: `${weekday} ${day} ខែ${month} ឆ្នាំ${year}`,
      time: `${translateNumber(String(displayHour))}:${minute} ${period}`,
    };
  }

  const englishDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Phnom_Penh",
  }).format(date);

  const englishTime = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Phnom_Penh",
  }).format(date);

  return {
    date: englishDate,
    time: englishTime,
  };
}

/* =========================================================
   PAYMENT STATUS

   Payment status and order fulfillment status are different.
========================================================= */

function getDisplayStatus(transaction: Transaction): string {
  const item = transaction as TransactionWithPaymentStatus;

  const paymentStatus = String(item.paymentStatus || "").toUpperCase();
  const status = String(transaction.status || "").toUpperCase();

  if (paymentStatus === "REFUNDED" || status === "REFUNDED") {
    return "REFUNDED";
  }

  if (paymentStatus === "FAILED" || status === "FAILED") {
    return "FAILED";
  }

  if (paymentStatus === "PAID" || status === "PAID") {
    return "PAID";
  }

  if (status === "CANCELLED") {
    return "CANCELLED";
  }

  if (paymentStatus === "UNPAID" || status === "PENDING") {
    return "PENDING";
  }

  return "PENDING";
}

/* =========================================================
   AMOUNT SIGN AND COLOR
========================================================= */

function getAmountSign(status: string): string {
  switch (status) {
    case "PAID":
    case "PENDING":
      return "+";

    case "REFUNDED":
      return "-";

    case "FAILED":
    case "CANCELLED":
    default:
      return "";
  }
}

function getAmountClass(status: string): string {
  if (status === "REFUNDED") return "text-violet-600";

  if (status === "FAILED" || status === "CANCELLED") {
    return "text-red-600";
  }

  return "text-slate-800";
}

/* =========================================================
   STATUS BADGE
========================================================= */

function getStatusClass(status: string): string {
  switch (status) {
    case "PAID":
      return "border-emerald-100 bg-emerald-50 text-emerald-700";

    case "PENDING":
      return "border-amber-100 bg-amber-50 text-amber-700";

    case "FAILED":
    case "CANCELLED":
      return "border-red-100 bg-red-50 text-red-700";

    case "REFUNDED":
      return "border-violet-100 bg-violet-50 text-violet-700";

    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

/* =========================================================
   OTHER TRANSACTION HELPERS
========================================================= */

function getCategory(transaction: Transaction): string {
  const category = transaction.items?.[0]?.category;

  return category?.trim() || "Other";
}

function getMerchantName(transaction: Transaction): string {
  if (
    transaction.customerName &&
    transaction.customerName !== "Walk-in Customer"
  ) {
    return transaction.customerName;
  }

  return transaction.storeId || "Store";
}

function getTransactionAmount(transaction: Transaction): number {
  const amount = safeNumber(transaction.amount);

  if (amount !== 0) return amount;

  return safeNumber(transaction.total);
}

function getInitials(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/* =========================================================
   PAGE
========================================================= */

export default function TransactionsPage() {
  const { locale } = useTranslation();

  const currentLocale: Locale = locale === "km" ? "km" : "en";
  const t = translations[currentLocale];

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [amountFilter, setAmountFilter] = useState("ALL");
  const [dateRange, setDateRange] = useState("LAST_30_DAYS");

  const [currentPage, setCurrentPage] = useState(1);

  const [selectedGateway, setSelectedGateway] = useState<
    "ABA" | "ACLEDA" | "KHQR" | null
  >(null);

  const paymentQrCodes = {
    ABA: "/image/khqr.jpg",
    ACLEDA: "/image/khqr.jpg",
    KHQR: "/image/khqr.jpg",
  };

  const translateStatus = (status: string) => {
    return t.statuses[status as keyof typeof t.statuses] || status;
  };

  const translatePaymentMethod = (gateway: string) => {
    const normalized = gateway.toUpperCase();

    return (
      t.methods[normalized as keyof typeof t.methods] ||
      getPaymentMethodLabel(gateway)
    );
  };

  /* ==================================================
     LOAD TRANSACTIONS
  ================================================== */

  useEffect(() => {
    const controller = new AbortController();

    async function loadTransactions() {
      try {
        setIsLoading(true);
        setLoadError("");

        const response = await fetch("/api/transactions?limit=1000", {
          method: "GET",
          cache: "no-store",
          credentials: "include",
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || data.error || "Failed to load transactions.",
          );
        }

        setTransactions(
          Array.isArray(data.transactions) ? data.transactions : [],
        );
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        setLoadError(
          error instanceof Error
            ? error.message
            : "Unable to load transactions.",
        );

        setTransactions([]);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadTransactions();

    return () => controller.abort();
  }, []);

  /* ==================================================
     DATE FILTER
  ================================================== */

  const isWithinDateRange = (transaction: Transaction) => {
    if (dateRange === "ALL") return true;

    const transactionDate = safeDate(transaction.createdAt);

    if (!transactionDate) return false;

    const now = new Date();

    if (dateRange === "TODAY") {
      return transactionDate.toDateString() === now.toDateString();
    }

    if (dateRange === "YESTERDAY") {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      return transactionDate.toDateString() === yesterday.toDateString();
    }

    if (dateRange === "LAST_7_DAYS") {
      const start = new Date();
      start.setDate(start.getDate() - 7);

      return transactionDate >= start;
    }

    if (dateRange === "LAST_30_DAYS") {
      const start = new Date();
      start.setDate(start.getDate() - 30);

      return transactionDate >= start;
    }

    if (dateRange === "THIS_MONTH") {
      return (
        transactionDate.getMonth() === now.getMonth() &&
        transactionDate.getFullYear() === now.getFullYear()
      );
    }

    return true;
  };

  /* ==================================================
     CATEGORIES
  ================================================== */

  const categories = useMemo(() => {
    const values = transactions.map(getCategory).filter(Boolean);

    return Array.from(new Set(values));
  }, [transactions]);

  /* ==================================================
     FILTER TRANSACTIONS
  ================================================== */

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const category = getCategory(transaction);
      const paymentMethod = getPaymentMethodLabel(transaction.gateway);
      const amount = getTransactionAmount(transaction);
      const displayStatus = getDisplayStatus(transaction);

      const matchesSearch =
        !query ||
        String(transaction.id || "")
          .toLowerCase()
          .includes(query) ||
        String(transaction.storeId || "")
          .toLowerCase()
          .includes(query) ||
        String(transaction.customerName || "")
          .toLowerCase()
          .includes(query) ||
        String(transaction.gateway || "")
          .toLowerCase()
          .includes(query) ||
        paymentMethod.toLowerCase().includes(query) ||
        category.toLowerCase().includes(query);

      const matchesCategory =
        categoryFilter === "ALL" || category === categoryFilter;

      const matchesStatus =
        statusFilter === "ALL" || displayStatus === statusFilter;

      let matchesAmount = true;

      if (amountFilter === "UNDER_50") {
        matchesAmount = amount < 50;
      }

      if (amountFilter === "50_100") {
        matchesAmount = amount >= 50 && amount <= 100;
      }

      if (amountFilter === "OVER_100") {
        matchesAmount = amount > 100;
      }

      const matchesDate = isWithinDateRange(transaction);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus &&
        matchesAmount &&
        matchesDate
      );
    });
  }, [
    transactions,
    search,
    categoryFilter,
    statusFilter,
    amountFilter,
    dateRange,
  ]);

  /* ==================================================
     SORT NEWEST FIRST
  ================================================== */

  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      const dateA = safeDate(a.createdAt);
      const dateB = safeDate(b.createdAt);

      return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
    });
  }, [filteredTransactions]);

  /* ==================================================
     PAGINATION
  ================================================== */

  const totalPages = Math.max(
    1,
    Math.ceil(sortedTransactions.length / ITEMS_PER_PAGE),
  );

  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;

  const currentTransactions = sortedTransactions.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, statusFilter, amountFilter, dateRange]);

  /* ==================================================
     SUMMARY
  ================================================== */

  const summary = useMemo(() => {
    const paid = transactions.filter(
      (transaction) => getDisplayStatus(transaction) === "PAID",
    );

    const totalSpent = paid.reduce(
      (sum, transaction) => sum + getTransactionAmount(transaction),
      0,
    );

    const validDates = paid
      .map((transaction) => safeDate(transaction.createdAt))
      .filter((date): date is Date => date !== null);

    const days = new Set(validDates.map((date) => date.toDateString()));

    const averagePerDay = days.size > 0 ? totalSpent / days.size : 0;

    return {
      totalTransactions: transactions.length,
      totalSpent: safeNumber(totalSpent),
      averagePerDay: safeNumber(averagePerDay),
      paidCount: paid.length,
    };
  }, [transactions]);

  /* ==================================================
     CATEGORY SUMMARY
  ================================================== */

  const categorySummary = useMemo(() => {
    const map = new Map<string, number>();

    transactions
      .filter((transaction) => getDisplayStatus(transaction) === "PAID")
      .forEach((transaction) => {
        const category = getCategory(transaction);
        const amount = getTransactionAmount(transaction);

        map.set(category, safeNumber((map.get(category) || 0) + amount));
      });

    const values = Array.from(map.entries())
      .map(([name, amount]) => ({
        name,
        amount: safeNumber(amount),
      }))
      .sort((a, b) => b.amount - a.amount);

    const total = values.reduce((sum, item) => sum + item.amount, 0);

    return {
      values,
      total: safeNumber(total),
    };
  }, [transactions]);

  /* ==================================================
     TOP MERCHANTS
  ================================================== */

  const topMerchants = useMemo(() => {
    const map = new Map<string, { amount: number; count: number }>();

    transactions
      .filter((transaction) => getDisplayStatus(transaction) === "PAID")
      .forEach((transaction) => {
        const merchant = getMerchantName(transaction);

        const existing = map.get(merchant) || {
          amount: 0,
          count: 0,
        };

        existing.amount += getTransactionAmount(transaction);
        existing.count += 1;

        map.set(merchant, existing);
      });

    return Array.from(map.entries())
      .map(([name, data]) => ({
        name,
        amount: safeNumber(data.amount),
        count: data.count,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [transactions]);

  /* ==================================================
     EXPORT CSV
========================================================= */

  const exportCSV = () => {
    if (sortedTransactions.length === 0) return;

    const headers = [
      "Transaction ID",
      "Store ID",
      "Customer",
      "Category",
      "Amount",
      "Currency",
      "Gateway",
      "Payment Status",
      "Order Status",
      "Created At",
      "Paid At",
    ];

    const rows = sortedTransactions.map((transaction) => {
      const item = transaction as TransactionWithPaymentStatus;

      return [
        transaction.id,
        transaction.storeId,
        transaction.customerName,
        getCategory(transaction),
        getTransactionAmount(transaction),
        transaction.currency,
        transaction.gateway,
        getDisplayStatus(transaction),
        item.orderStatus || "",
        transaction.createdAt,
        transaction.paidAt || "",
      ];
    });

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "transactions.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  /* ==================================================
     DONUT CHART
  ================================================== */

  const donutStyle = useMemo(() => {
    if (categorySummary.total <= 0) {
      return {
        background: "conic-gradient(#e2e8f0 0deg 360deg)",
      };
    }

    let currentDegree = 0;

    const parts = categorySummary.values.map((item, index) => {
      const degree = (safeNumber(item.amount) / categorySummary.total) * 360;

      const start = currentDegree;
      const end = currentDegree + degree;

      currentDegree = end;

      return `${donutColors[index % donutColors.length]} ${start}deg ${end}deg`;
    });

    return {
      background: `conic-gradient(${parts.join(", ")})`,
    };
  }, [categorySummary]);

  /* ==================================================
     RENDER
  ================================================== */

  return (
    <div className="min-h-full bg-[#f8f9fa] p-3 sm:p-5 lg:p-6">
      <div className="mx-auto max-w-[1600px]">
        {/* HEADER */}

        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {t.title}
            </h1>

            <p className="mt-1 text-sm text-slate-500">{t.subtitle}</p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-9 gap-2 bg-white text-xs">
              <CalendarDays className="h-4 w-4" />
              {t.dateRange}
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>

            <Button
              onClick={exportCSV}
              variant="outline"
              disabled={isLoading || sortedTransactions.length === 0}
              className="h-9 gap-2 bg-white text-xs"
            >
              <Download className="h-4 w-4" />
              {t.exportCSV}
            </Button>
          </div>
        </div>

        {/* DATE FILTER */}

        <div className="mb-5 flex flex-wrap gap-2">
          {[
            ["LAST_30_DAYS", t.last30Days],
            ["TODAY", t.today],
            ["YESTERDAY", t.yesterday],
            ["LAST_7_DAYS", t.last7Days],
            ["THIS_MONTH", t.thisMonth],
            ["ALL", t.allTime],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setDateRange(value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                dateRange === value
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* KPI CARDS */}

        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-start justify-between">
              <span className="text-xs font-medium text-slate-500">
                {t.totalTransactions}
              </span>

              <div className="rounded-lg bg-slate-100 p-2">
                <ShoppingBag className="h-4 w-4 text-slate-600" />
              </div>
            </div>

            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold text-slate-900">
                {summary.totalTransactions.toLocaleString(
                  currentLocale === "km" ? "km-KH" : "en-US",
                )}
              </span>

              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-700">
                <ArrowUp className="h-3 w-3" />
                {summary.paidCount} {t.paid}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-start justify-between">
              <span className="text-xs font-medium text-slate-500">
                {t.totalSpent}
              </span>

              <div className="rounded-lg bg-emerald-50 p-2">
                <CircleDollarSign className="h-4 w-4 text-emerald-600" />
              </div>
            </div>

            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold text-slate-900">
                {safeFormatCurrency(summary.totalSpent)}
              </span>

              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-700">
                <TrendingUp className="h-4 w-4" />
                {t.paid}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-start justify-between">
              <span className="text-xs font-medium text-slate-500">
                {t.avgPerDay}
              </span>

              <div className="rounded-lg bg-cyan-50 p-2">
                <Clock3 className="h-4 w-4 text-cyan-600" />
              </div>
            </div>

            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold text-slate-900">
                {safeFormatCurrency(summary.averagePerDay)}
              </span>

              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-700">
                <ArrowUp className="h-3 w-3" />
                {t.daily}
              </span>
            </div>
          </div>
        </div>

        {/* MAIN GRID */}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          {/* TRANSACTIONS TABLE */}

          <div className="min-w-0">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              {/* SEARCH AND FILTERS */}

              <div className="border-b border-slate-100 p-3">
                <div className="flex flex-col gap-2 lg:flex-row">
                  <div className="relative min-w-0 flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <Input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder={t.search}
                      className="h-9 border-slate-200 pl-9 text-xs shadow-none focus-visible:ring-1"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <select
                      value={categoryFilter}
                      onChange={(event) =>
                        setCategoryFilter(event.target.value)
                      }
                      className="h-9 min-w-[120px] rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-600 outline-none"
                    >
                      <option value="ALL">{t.allCategories}</option>

                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {translateCategory(category, currentLocale)}
                        </option>
                      ))}
                    </select>

                    <select
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value)}
                      className="h-9 min-w-[110px] rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-600 outline-none"
                    >
                      <option value="ALL">{t.allStatuses}</option>
                      <option value="PAID">{t.statuses.PAID}</option>
                      <option value="PENDING">{t.statuses.PENDING}</option>
                      <option value="FAILED">{t.statuses.FAILED}</option>
                      <option value="REFUNDED">{t.statuses.REFUNDED}</option>
                      <option value="CANCELLED">{t.statuses.CANCELLED}</option>
                    </select>

                    <select
                      value={amountFilter}
                      onChange={(event) => setAmountFilter(event.target.value)}
                      className="hidden h-9 min-w-[110px] rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-600 outline-none sm:block"
                    >
                      <option value="ALL">{t.allAmounts}</option>
                      <option value="UNDER_50">{t.under50}</option>
                      <option value="50_100">{t.between50And100}</option>
                      <option value="OVER_100">{t.over100}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* TABLE */}

              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60">
                      <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        {t.dateTime}
                      </th>

                      <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        {t.description}
                      </th>

                      <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        {t.category}
                      </th>

                      <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        {t.account}
                      </th>

                      <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        {t.amount}
                      </th>

                      <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        {t.status}
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-16 text-center">
                          <RefreshCw className="mx-auto mb-3 h-6 w-6 animate-spin text-emerald-600" />

                          <p className="text-sm font-semibold text-slate-700">
                            {t.loadingTransactions}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {t.connectingMongoDB}
                          </p>
                        </td>
                      </tr>
                    ) : loadError ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-16 text-center">
                          <p className="text-sm font-semibold text-red-600">
                            {t.unableToLoad}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {loadError}
                          </p>

                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-4"
                            onClick={() => window.location.reload()}
                          >
                            <RefreshCw className="mr-2 h-3.5 w-3.5" />
                            {t.tryAgain}
                          </Button>
                        </td>
                      </tr>
                    ) : currentTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-16 text-center">
                          <ShoppingBag className="mx-auto mb-3 h-6 w-6 text-slate-400" />

                          <p className="text-sm font-semibold text-slate-800">
                            {t.noTransactions}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {t.noTransactionsMatch}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      currentTransactions.map((transaction) => {
                        const category = getCategory(transaction);
                        const merchant = getMerchantName(transaction);
                        const amount = getTransactionAmount(transaction);
                        const displayStatus = getDisplayStatus(transaction);
                        const amountSign = getAmountSign(displayStatus);

                        const localizedDate = formatTransactionDateLocalized(
                          transaction.createdAt,
                          currentLocale,
                        );

                        return (
                          <tr
                            key={transaction.id}
                            className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
                          >
                            {/* DATE */}

                            <td className="px-4 py-3">
                              <div className="flex max-w-[210px] flex-col">
                                <span className="text-[11px] font-semibold text-slate-800">
                                  {localizedDate.date}
                                </span>

                                <span className="mt-0.5 text-[10px] text-slate-400">
                                  {localizedDate.time}
                                </span>
                              </div>
                            </td>

                            {/* DESCRIPTION */}

                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[9px] font-bold text-slate-500">
                                  {getInitials(merchant)}
                                </div>

                                <div className="min-w-0">
                                  <p className="truncate text-xs font-semibold text-slate-800">
                                    {merchant}
                                  </p>

                                  <p className="truncate text-[10px] text-slate-400">
                                    {transaction.id}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* CATEGORY */}

                            <td className="px-4 py-3">
                              <span className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">
                                {translateCategory(category, currentLocale)}
                              </span>
                            </td>

                            {/* ACCOUNT */}

                            <td className="px-4 py-3">
                              <div className="flex flex-col">
                                <span className="text-[11px] text-slate-600">
                                  {translatePaymentMethod(transaction.gateway)}
                                </span>

                                <span className="text-[10px] text-slate-400">
                                  {transaction.gateway}
                                </span>
                              </div>
                            </td>

                            {/* AMOUNT */}

                            <td className="px-4 py-3 text-right">
                              <span
                                className={`text-xs font-bold ${getAmountClass(
                                  displayStatus,
                                )}`}
                              >
                                {amountSign}
                                {safeFormatCurrency(
                                  Math.abs(amount),
                                  transaction.currency || "USD",
                                )}
                              </span>
                            </td>

                            {/* PAYMENT STATUS */}

                            <td className="px-4 py-3 text-right">
                              <Badge
                                variant="outline"
                                className={`text-[9px] ${getStatusClass(
                                  displayStatus,
                                )}`}
                              >
                                {translateStatus(displayStatus)}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION */}

              <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[11px] text-slate-400">
                  {isLoading
                    ? t.loadingTransactions
                    : loadError
                      ? t.transactionsUnavailable
                      : sortedTransactions.length === 0
                        ? t.noTransactions
                        : `${t.showing} ${startIndex + 1}-${Math.min(
                            startIndex + ITEMS_PER_PAGE,
                            sortedTransactions.length,
                          )} ${t.of} ${sortedTransactions.length} ${t.transactions}`}
                </p>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-[10px]"
                    disabled={safePage === 1 || isLoading || !!loadError}
                    onClick={() => setCurrentPage(safePage - 1)}
                  >
                    {t.previous}
                  </Button>

                  {Array.from(
                    { length: Math.min(5, totalPages) },
                    (_, index) => {
                      let page = index + 1;

                      if (
                        totalPages > 5 &&
                        safePage > 3 &&
                        safePage < totalPages - 2
                      ) {
                        page = safePage - 2 + index;
                      } else if (totalPages > 5 && safePage >= totalPages - 2) {
                        page = totalPages - 4 + index;
                      }

                      return (
                        <Button
                          key={page}
                          variant={safePage === page ? "default" : "outline"}
                          size="sm"
                          className="h-7 min-w-7 px-2 text-[10px]"
                          disabled={isLoading || !!loadError}
                          onClick={() => setCurrentPage(page)}
                        >
                          {currentLocale === "km"
                            ? translateNumber(String(page))
                            : page}
                        </Button>
                      );
                    },
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-[10px]"
                    disabled={
                      safePage === totalPages || isLoading || !!loadError
                    }
                    onClick={() => setCurrentPage(safePage + 1)}
                  >
                    {t.next}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}

          <div className="space-y-5">
            {/* SPENDING BY CATEGORY */}

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900">
                  {t.spendingByCategory}
                </h2>

                <ChevronDown className="h-4 w-4 text-slate-400" />
              </div>

              <div className="flex justify-center">
                <div
                  className="relative flex h-40 w-40 items-center justify-center rounded-full"
                  style={donutStyle}
                >
                  <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white shadow-inner">
                    <span className="text-lg font-bold text-slate-800">
                      {safeFormatCurrency(categorySummary.total)}
                    </span>

                    <span className="text-[10px] text-slate-400">
                      {t.total}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-2.5">
                {categorySummary.values.slice(0, 5).map((category, index) => {
                  const percentage =
                    categorySummary.total > 0
                      ? (category.amount / categorySummary.total) * 100
                      : 0;

                  return (
                    <div
                      key={category.name}
                      className="flex items-center justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{
                            backgroundColor:
                              donutColors[index % donutColors.length],
                          }}
                        />

                        <span className="truncate text-[11px] text-slate-500">
                          {translateCategory(category.name, currentLocale)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">
                          {currentLocale === "km"
                            ? translateNumber(percentage.toFixed(0))
                            : percentage.toFixed(0)}
                          %
                        </span>

                        <span className="text-[11px] font-semibold text-slate-700">
                          {safeFormatCurrency(category.amount)}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {categorySummary.values.length === 0 && (
                  <div className="py-4 text-center text-xs text-slate-400">
                    {isLoading ? t.loadingTransactions : t.noSpendingData}
                  </div>
                )}
              </div>
            </div>

            {/* TOP MERCHANTS */}

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900">
                  {t.topMerchants}
                </h2>

                <span className="text-[10px] text-slate-400">{t.paid}</span>
              </div>

              <div className="space-y-4">
                {topMerchants.map((merchant) => (
                  <div
                    key={merchant.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[9px] font-bold text-slate-500">
                        {getInitials(merchant.name)}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-semibold text-slate-700">
                          {merchant.name}
                        </p>

                        <p className="text-[9px] text-slate-400">
                          {currentLocale === "km"
                            ? `${translateNumber(String(merchant.count))} ${t.transaction}`
                            : `${merchant.count} ${
                                merchant.count !== 1
                                  ? t.transactionPlural
                                  : t.transaction
                              }`}
                        </p>
                      </div>
                    </div>

                    <span className="ml-2 shrink-0 text-[11px] font-bold text-slate-700">
                      {safeFormatCurrency(merchant.amount)}
                    </span>
                  </div>
                ))}

                {topMerchants.length === 0 && (
                  <div className="py-4 text-center text-xs text-slate-400">
                    {isLoading ? t.loadingTransactions : t.noMerchantData}
                  </div>
                )}
              </div>
            </div>

            {/* PAYMENT METHODS */}

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-4 text-sm font-bold text-slate-900">
                {t.paymentMethods}
              </h2>

              <div className="space-y-3">
                {(["CASH", "ABA", "ACLEDA", "KHQR"] as const).map((gateway) => {
                  const gatewayTransactions = transactions.filter(
                    (transaction) =>
                      transaction.gateway === gateway &&
                      getDisplayStatus(transaction) === "PAID",
                  );

                  const gatewayAmount = gatewayTransactions.reduce(
                    (sum, transaction) =>
                      sum + getTransactionAmount(transaction),
                    0,
                  );

                  const isQrGateway =
                    gateway === "ABA" ||
                    gateway === "ACLEDA" ||
                    gateway === "KHQR";

                  return (
                    <button
                      key={gateway}
                      type="button"
                      disabled={!isQrGateway}
                      onClick={() => {
                        if (isQrGateway) {
                          setSelectedGateway(gateway);
                        }
                      }}
                      className={`flex w-full items-center justify-between rounded-lg p-2 text-left transition ${
                        isQrGateway
                          ? "cursor-pointer hover:bg-emerald-50"
                          : "cursor-default"
                      } ${
                        selectedGateway === gateway
                          ? "bg-emerald-50 ring-1 ring-emerald-200"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />

                        <span className="text-[11px] font-medium text-slate-600">
                          {translatePaymentMethod(gateway)}
                        </span>
                      </div>

                      <div className="text-right">
                        <p className="text-[11px] font-semibold text-slate-700">
                          {safeFormatCurrency(gatewayAmount)}
                        </p>

                        <p className="text-[9px] text-slate-400">
                          {currentLocale === "km"
                            ? `${translateNumber(String(gatewayTransactions.length))} ${t.payments}`
                            : `${gatewayTransactions.length} ${t.payments}`}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* QR CODE DISPLAY */}

              {selectedGateway && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800">
                      {selectedGateway} {t.qrPayment}
                    </h3>

                    <button
                      type="button"
                      onClick={() => setSelectedGateway(null)}
                      className="text-xs font-medium text-slate-500 hover:text-red-500"
                    >
                      {t.close}
                    </button>
                  </div>

                  <div className="flex flex-col items-center rounded-lg bg-white p-4">
                    <img
                      src={paymentQrCodes[selectedGateway]}
                      alt={`${selectedGateway} payment QR code`}
                      className="h-56 w-56 object-contain"
                    />

                    <p className="mt-3 text-xs font-medium text-slate-500">
                      {t.scanToPay} {selectedGateway}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
