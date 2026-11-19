"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MoreHorizontal,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/transactions";
import { useTranslation } from "@/hooks/use-translation";

type DateRange = "7d" | "30d" | "all";

interface DailyRevenue {
  date: string;
  revenue: number;
  transactions: number;
}

interface ReportsResponse {
  success: boolean;
  dailyRevenue: DailyRevenue[];
  summary: {
    totalRevenue: number;
    paidOrders: number;
  };
  message?: string;
}

interface RevenueDay {
  date: string;
  day: string;
  revenue: number;
  transactions: number;
}

// ======================================================
// SAFE NUMBER
// ======================================================

const safeNumber = (value: unknown): number => {
  const number =
    typeof value === "string"
      ? Number(value.replace(/[$,\s]/g, ""))
      : Number(value);

  return Number.isFinite(number) ? number : 0;
};

// ======================================================
// DATE HELPERS
// ======================================================

// Use local date instead of UTC ISO date.
// This avoids the previous-day issue in Cambodia (UTC+7).

const formatISODate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);

  return result;
};

const getDateRange = (range: DateRange) => {
  if (range === "all") return null;

  const today = new Date();
  const days = range === "7d" ? 7 : 30;

  const to = formatISODate(today);
  const from = formatISODate(addDays(today, -(days - 1)));

  return { from, to, days };
};

// ======================================================
// MANUAL ENGLISH / KHMER DATE FORMATTING
// ======================================================

const ENGLISH_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
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

const ENGLISH_WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const KHMER_WEEKDAYS = [
  "ថ្ងៃអាទិត្យ",
  "ថ្ងៃចន្ទ",
  "ថ្ងៃអង្គារ",
  "ថ្ងៃពុធ",
  "ថ្ងៃព្រហស្បតិ៍",
  "ថ្ងៃសុក្រ",
  "ថ្ងៃសៅរ៍",
];

// Convert English digits to Khmer digits.

const toKhmerDigits = (value: number | string): string => {
  const khmerDigits = "០១២៣៤៥៦៧៨៩";

  return String(value).replace(/\d/g, (digit) => {
    return khmerDigits[Number(digit)];
  });
};

// Safely parse YYYY-MM-DD without timezone shifting.

const getDateParts = (dateString: string) => {
  const [year, month, day] = dateString.slice(0, 10).split("-").map(Number);

  if (
    !year ||
    !month ||
    !day ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day));

  // Reject invalid calendar dates such as February 31.

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return {
    year,
    month,
    day,
    date,
  };
};

// Format month and day.
//
// English: November 18
// Khmer: ១៨ វិច្ឆិកា

const formatDay = (dateString: string, locale: string): string => {
  const parts = getDateParts(dateString);

  if (!parts) return dateString;

  const isKhmer = locale === "km";

  if (isKhmer) {
    const monthName = KHMER_MONTHS[parts.month - 1];

    return `${toKhmerDigits(parts.day)} ${monthName}`;
  }

  return `${ENGLISH_MONTHS[parts.month - 1]} ${parts.day}`;
};

// Format weekday.
//
// English: Wednesday
// Khmer: ថ្ងៃពុធ

const formatWeekday = (dateString: string, locale: string): string => {
  const parts = getDateParts(dateString);

  if (!parts) return dateString;

  const weekday = parts.date.getUTCDay();

  return locale === "km" ? KHMER_WEEKDAYS[weekday] : ENGLISH_WEEKDAYS[weekday];
};

// Format numbers according to selected language.

const formatNumber = (value: number, locale: string): string => {
  if (locale === "km") {
    return toKhmerDigits(value.toLocaleString("en-US"));
  }

  return value.toLocaleString("en-US");
};

// ======================================================
// CURRENCY
// ======================================================

const safeFormatCurrency = (value: unknown): string => {
  return formatCurrency(safeNumber(value));
};

// ======================================================
// REVENUE OVERVIEW
// ======================================================

export default function RevenueOverview() {
  const { t, locale } = useTranslation();

  const [range, setRange] = useState<DateRange>("7d");
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
  const [previousRevenue, setPreviousRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keep the latest translation function without making the
  // data-fetching callback change on every render.

  const tRef = useRef(t);

  useEffect(() => {
    tRef.current = t;
  }, [t]);

  // ====================================================
  // LOAD REVENUE
  // ====================================================

  const loadRevenue = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const currentRange = getDateRange(range);

      const buildUrl = (from?: string, to?: string) => {
        const params = new URLSearchParams();

        params.set("page", "1");
        params.set("limit", "1");

        if (from) params.set("from", from);
        if (to) params.set("to", to);

        return `/api/admin/reports?${params.toString()}`;
      };

      const currentUrl = currentRange
        ? buildUrl(currentRange.from, currentRange.to)
        : buildUrl();

      const currentResponse = await fetch(currentUrl, {
        method: "GET",
        cache: "no-store",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      const currentData = (await currentResponse.json()) as ReportsResponse;

      if (!currentResponse.ok || !currentData.success) {
        throw new Error(
          currentData.message ||
            tRef.current("overview.revenue.errors.current"),
        );
      }

      setDailyRevenue(
        Array.isArray(currentData.dailyRevenue) ? currentData.dailyRevenue : [],
      );

      // Previous period comparison.

      if (currentRange) {
        const previousTo = formatISODate(
          addDays(new Date(`${currentRange.from}T00:00:00`), -1),
        );

        const previousFrom = formatISODate(
          addDays(
            new Date(`${currentRange.from}T00:00:00`),
            -currentRange.days,
          ),
        );

        const previousResponse = await fetch(
          buildUrl(previousFrom, previousTo),
          {
            method: "GET",
            cache: "no-store",
            credentials: "include",
            headers: {
              Accept: "application/json",
            },
          },
        );

        const previousData = (await previousResponse.json()) as ReportsResponse;

        if (!previousResponse.ok || !previousData.success) {
          throw new Error(
            previousData.message ||
              tRef.current("overview.revenue.errors.previous"),
          );
        }

        const previousTotal = Array.isArray(previousData.dailyRevenue)
          ? previousData.dailyRevenue.reduce(
              (sum, item) => sum + safeNumber(item.revenue),
              0,
            )
          : 0;

        setPreviousRevenue(previousTotal);
      } else {
        setPreviousRevenue(0);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : tRef.current("overview.revenue.errors.general"),
      );
    } finally {
      setLoading(false);
    }
  }, [range]);

  // ====================================================
  // FETCH WHEN RANGE CHANGES
  // ====================================================

  useEffect(() => {
    void loadRevenue();
  }, [loadRevenue]);

  // ====================================================
  // PREPARE REVENUE DATA
  // ====================================================

  const revenueData = useMemo<RevenueDay[]>(() => {
    const revenueMap = new Map(dailyRevenue.map((item) => [item.date, item]));

    const currentRange = getDateRange(range);

    if (currentRange) {
      const result: RevenueDay[] = [];

      for (let i = 0; i < currentRange.days; i++) {
        const date = formatISODate(
          addDays(new Date(`${currentRange.from}T00:00:00`), i),
        );

        const item = revenueMap.get(date);

        result.push({
          date,
          day: formatWeekday(date, locale),
          revenue: safeNumber(item?.revenue),
          transactions: safeNumber(item?.transactions),
        });
      }

      return result;
    }

    return [...dailyRevenue]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((item) => ({
        date: item.date,
        day: formatWeekday(item.date, locale),
        revenue: safeNumber(item.revenue),
        transactions: safeNumber(item.transactions),
      }));
  }, [dailyRevenue, range, locale]);

  // ====================================================
  // CALCULATE TOTAL REVENUE
  // ====================================================

  const currentPeriodRevenue = useMemo(() => {
    return revenueData.reduce((sum, item) => sum + safeNumber(item.revenue), 0);
  }, [revenueData]);

  // ====================================================
  // CALCULATE TRANSACTIONS
  // ====================================================

  const currentPeriodTransactions = useMemo(() => {
    return revenueData.reduce(
      (sum, item) => sum + safeNumber(item.transactions),
      0,
    );
  }, [revenueData]);

  // ====================================================
  // REVENUE CHANGE
  // ====================================================

  const revenueChange = useMemo(() => {
    if (range === "all") return null;

    if (previousRevenue === 0) {
      return currentPeriodRevenue > 0 ? 100 : 0;
    }

    const change =
      ((currentPeriodRevenue - previousRevenue) / previousRevenue) * 100;

    return Number.isFinite(change) ? change : 0;
  }, [currentPeriodRevenue, previousRevenue, range]);

  // ====================================================
  // MAX REVENUE
  // ====================================================

  const maxRevenue = useMemo(() => {
    return Math.max(...revenueData.map((item) => safeNumber(item.revenue)), 1);
  }, [revenueData]);

  // ====================================================
  // DATE RANGE LABEL
  // ====================================================

  const rangeLabel =
    range === "7d"
      ? t("overview.revenue.ranges.7d")
      : range === "30d"
        ? t("overview.revenue.ranges.30d")
        : t("overview.revenue.ranges.all");

  // ====================================================
  // UI
  // ====================================================

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle>{t("overview.revenue.title")}</CardTitle>

          <CardDescription>
            {t("overview.revenue.subtitle", {
              range: rangeLabel.toLowerCase(),
            })}
          </CardDescription>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => void loadRevenue()}
            disabled={loading}
            title={t("overview.revenue.refresh")}
            aria-label={t("overview.revenue.refresh")}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                aria-label={t("overview.revenue.selectRange")}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setRange("7d")}>
                {t("overview.revenue.ranges.7d")}
              </DropdownMenuItem>

              <DropdownMenuItem onSelect={() => setRange("30d")}>
                {t("overview.revenue.ranges.30d")}
              </DropdownMenuItem>

              <DropdownMenuItem onSelect={() => setRange("all")}>
                {t("overview.revenue.ranges.all")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent>
        {/* ERROR MESSAGE */}

        {error && (
          <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/5 p-4">
            <p className="text-sm font-medium text-red-600">
              {t("overview.revenue.errors.title")}
            </p>

            <p className="mt-1 text-sm text-muted-foreground">{error}</p>

            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => void loadRevenue()}
            >
              {t("overview.revenue.tryAgain")}
            </Button>
          </div>
        )}

        {/* SUMMARY */}

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border bg-muted/30 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">
                  {t("overview.revenue.periodRevenue", {
                    range: rangeLabel,
                  })}
                </p>

                <p className="mt-1 truncate text-2xl font-bold">
                  {loading
                    ? t("common.loading")
                    : safeFormatCurrency(currentPeriodRevenue)}
                </p>
              </div>

              {revenueChange !== null && (
                <div
                  className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                    revenueChange >= 0
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-red-500/10 text-red-600"
                  }`}
                >
                  {revenueChange >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}

                  <span>{Math.abs(revenueChange).toFixed(1)}%</span>
                </div>
              )}
            </div>

            {range !== "all" && (
              <p className="mt-2 text-xs text-muted-foreground">
                {t("overview.revenue.comparison", {
                  days: range === "7d" ? "7" : "30",
                })}
              </p>
            )}
          </div>

          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">
              {t("overview.revenue.paidTransactions")}
            </p>

            <p className="mt-1 text-2xl font-bold">
              {loading
                ? t("common.loading")
                : formatNumber(currentPeriodTransactions, locale)}
            </p>

            <p className="mt-2 text-xs text-muted-foreground">
              {t("overview.revenue.successfulOrders")}
            </p>
          </div>
        </div>

        {/* CHART */}

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium">
                {t("overview.revenue.dailyRevenue")}
              </p>

              <p className="text-xs text-muted-foreground">
                {t("overview.revenue.chartDescription")}
              </p>
            </div>

            <Badge variant="outline">
              {loading
                ? t("common.loading")
                : t("overview.revenue.paidCount", {
                    count: formatNumber(currentPeriodTransactions, locale),
                  })}
            </Badge>
          </div>

          <div className="w-full overflow-x-auto">
            <div
              style={{
                minWidth: `${Math.max(560, revenueData.length * 82)}px`,
              }}
            >
              <div className="flex h-64 items-end gap-3 border-b px-2 pb-0">
                {revenueData.map((item) => {
                  const revenue = safeNumber(item.revenue);

                  const height =
                    revenue > 0 ? Math.max((revenue / maxRevenue) * 100, 4) : 2;

                  return (
                    <div
                      key={item.date}
                      className="flex h-full min-w-0 flex-1 flex-col justify-end"
                    >
                      <div className="mb-2 text-center">
                        <span className="text-[10px] font-medium text-muted-foreground sm:text-xs">
                          {safeFormatCurrency(revenue)}
                        </span>
                      </div>

                      <div className="flex h-full items-end justify-center">
                        <div
                          className="w-full max-w-12 rounded-t-md bg-primary/80 transition-all hover:bg-primary"
                          style={{
                            height: `${height}%`,
                          }}
                          title={`${formatDay(item.date, locale)}: ${safeFormatCurrency(revenue)}`}
                        />
                      </div>

                      <div className="mt-3 border-t pt-2 text-center">
                        <p className="text-xs font-medium">{item.day}</p>

                        <p className="text-[10px] text-muted-foreground">
                          {formatDay(item.date, locale)}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {!loading && revenueData.length === 0 && (
                  <div className="flex w-full items-center justify-center text-sm text-muted-foreground">
                    {t("overview.revenue.noData")}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* DAILY DETAILS */}

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {revenueData.map((item) => (
              <div
                key={`detail-${item.date}`}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="text-sm font-medium">{item.day}</p>

                  <p className="text-xs text-muted-foreground">
                    {formatDay(item.date, locale)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {safeFormatCurrency(item.revenue)}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {t("overview.revenue.paidCount", {
                      count: formatNumber(item.transactions, locale),
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
