"use client";

import { Banknote, CreditCard, DollarSign, Wallet } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { useTranslation } from "@/hooks/use-translation";

interface PaymentMethod {
  name: string;
  amount: number;
  transactions: number;
  percentage: number;
}

interface PaymentMethodsProps {
  paymentMethods: PaymentMethod[];
}

// ======================================================
// CURRENCY FORMATTING
// ======================================================

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

// ======================================================
// PAYMENT METHOD ICONS
// ======================================================

function getIcon(method: string) {
  switch (method.toUpperCase()) {
    case "CASH":
      return Banknote;

    case "CARD":
      return CreditCard;

    case "ABA":
    case "ACLEDA":
    case "KHQR":
      return Wallet;

    default:
      return DollarSign;
  }
}

// ======================================================
// PAYMENT METHOD TRANSLATION
// ======================================================

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

// ======================================================
// PAYMENT METHODS COMPONENT
// ======================================================

export default function PaymentMethods({
  paymentMethods,
}: PaymentMethodsProps) {
  const { t, locale } = useTranslation();

  // ====================================================
  // NUMBER FORMATTING
  // ====================================================

  const formatNumber = (value: number) => {
    const formatted = value.toLocaleString("en-US");

    if (locale === "km") {
      const khmerDigits = "០១២៣៤៥៦៧៨៩";

      return formatted.replace(/\d/g, (digit) => {
        return khmerDigits[Number(digit)];
      });
    }

    return formatted;
  };

  // ====================================================
  // UI
  // ====================================================

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("overview.paymentMethods.title")}</CardTitle>

        <CardDescription>
          {t("overview.paymentMethods.description")}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {paymentMethods.length === 0 ? (
          <div className="flex min-h-[180px] items-center justify-center text-sm text-muted-foreground">
            {t("overview.paymentMethods.empty")}
          </div>
        ) : (
          paymentMethods.map((payment) => {
            const Icon = getIcon(payment.name);

            return (
              <div key={payment.name} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  {/* PAYMENT METHOD */}

                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-muted p-2">
                      <Icon className="h-4 w-4" />
                    </div>

                    <div>
                      <p className="text-sm font-medium">
                        {getPaymentMethodLabel(payment.name, t)}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {t("overview.paymentMethods.transactions", {
                          count: formatNumber(payment.transactions),
                        })}
                      </p>
                    </div>
                  </div>

                  {/* AMOUNT AND PERCENTAGE */}

                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {formatCurrency(payment.amount)}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {formatNumber(payment.percentage)}%
                    </p>
                  </div>
                </div>

                {/* PROGRESS BAR */}

                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(0, payment.percentage),
                      )}%`,
                    }}
                  />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
