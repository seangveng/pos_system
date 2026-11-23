"use client";

import { CheckCircle2, Clock3, Ellipsis, Eye, XCircle } from "lucide-react";

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

import { useTranslation } from "@/hooks/use-translation";

import type { Transaction } from "@/types/transaction";

interface RecentTransactionsProps {
  transactions: Transaction[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function StatusBadge({
  status,
  t,
}: {
  status: string;
  t: (key: string) => string;
}) {
  if (status === "PAID") {
    return (
      <Badge
        variant="outline"
        className="border-emerald-200 bg-emerald-50 text-emerald-700"
      >
        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
        {t("overview.recentTransactions.status.paid")}
      </Badge>
    );
  }

  if (status === "PENDING") {
    return (
      <Badge
        variant="outline"
        className="border-amber-200 bg-amber-50 text-amber-700"
      >
        <Clock3 className="mr-1 h-3.5 w-3.5" />
        {t("overview.recentTransactions.status.pending")}
      </Badge>
    );
  }

  if (status === "FAILED") {
    return (
      <Badge
        variant="outline"
        className="border-red-200 bg-red-50 text-red-700"
      >
        <XCircle className="mr-1 h-3.5 w-3.5" />
        {t("overview.recentTransactions.status.failed")}
      </Badge>
    );
  }

  return <Badge variant="outline">{status}</Badge>;
}

function getPaymentMethodLabel(method: string, t: (key: string) => string) {
  switch (method.toUpperCase()) {
    case "CASH":
      return t("overview.paymentMethods.names.cash");

    case "CARD":
      return t("overview.paymentMethods.names.card");

    case "KHQR":
      return t("overview.paymentMethods.names.khqr");

    case "ACLEDA":
      return t("overview.paymentMethods.names.acleda");

    case "ABA":
      return t("overview.paymentMethods.names.aba");

    default:
      return method;
  }
}

export default function RecentTransactions({
  transactions,
}: RecentTransactionsProps) {
  const { t, locale } = useTranslation();

  const formatDate = (date: string | Date) => {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "-";

    return new Intl.DateTimeFormat(locale === "km" ? "km-KH" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(parsedDate);
  };

  // Transaction uses "gateway" for the payment method.
  const getPaymentMethod = (transaction: Transaction) => {
    return getPaymentMethodLabel(transaction.gateway || "OTHER", t);
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>{t("overview.recentTransactions.title")}</CardTitle>

          <CardDescription>
            {t("overview.recentTransactions.description")}
          </CardDescription>
        </div>

        <Button variant="outline">
          {t("overview.recentTransactions.viewAll")}
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        {transactions.length === 0 ? (
          <div className="flex min-h-[180px] items-center justify-center text-sm text-muted-foreground">
            {t("overview.recentTransactions.empty")}
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="border-y bg-muted/30">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                      {t("overview.recentTransactions.columns.transaction")}
                    </th>

                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                      {t("overview.recentTransactions.columns.payment")}
                    </th>

                    <th className="px-6 py-3 text-right font-medium text-muted-foreground">
                      {t("overview.recentTransactions.columns.amount")}
                    </th>

                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                      {t("overview.recentTransactions.columns.status")}
                    </th>

                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                      {t("overview.recentTransactions.columns.date")}
                    </th>

                    <th className="w-12 px-6 py-3" />
                  </tr>
                </thead>

                <tbody>
                  {transactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-b last:border-0 hover:bg-muted/20"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium">{transaction.id}</p>
                      </td>

                      <td className="px-6 py-4">
                        <Badge variant="secondary">
                          {getPaymentMethod(transaction)}
                        </Badge>
                      </td>

                      <td className="px-6 py-4 text-right font-semibold">
                        {formatCurrency(Number(transaction.amount || 0))}
                      </td>

                      <td className="px-6 py-4">
                        <StatusBadge status={transaction.status} t={t} />
                      </td>

                      <td className="px-6 py-4 text-muted-foreground">
                        {transaction.createdAt
                          ? formatDate(transaction.createdAt)
                          : "-"}
                      </td>

                      <td className="px-6 py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Ellipsis className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              {t("overview.recentTransactions.viewTransaction")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="divide-y md:hidden">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{transaction.id}</p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {transaction.createdAt
                          ? formatDate(transaction.createdAt)
                          : "-"}
                      </p>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Ellipsis className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          {t("overview.recentTransactions.viewTransaction")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">
                      {getPaymentMethod(transaction)}
                    </Badge>

                    <p className="font-semibold">
                      {formatCurrency(Number(transaction.amount || 0))}
                    </p>
                  </div>

                  <StatusBadge status={transaction.status} t={t} />
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
