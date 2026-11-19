"use client";

import { CheckCircle2, Clock3, RefreshCw, XCircle } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import { useTranslation } from "@/hooks/use-translation";

interface TransactionStatusProps {
  successful: number;
  pending: number;
  failed: number;
  refunded: number;
}

export default function TransactionStatus({
  successful,
  pending,
  failed,
  refunded,
}: TransactionStatusProps) {
  const { t } = useTranslation();

  const values = {
    successful,
    pending,
    failed,
    refunded,
  };

  const statusConfig = [
    {
      key: "successful",
      title: t("overview.transactionStatus.successful"),
      icon: CheckCircle2,
      className: "bg-emerald-500/10 text-emerald-600",
    },
    {
      key: "pending",
      title: t("overview.transactionStatus.pending"),
      icon: Clock3,
      className: "bg-amber-500/10 text-amber-600",
    },
    {
      key: "failed",
      title: t("overview.transactionStatus.failed"),
      icon: XCircle,
      className: "bg-red-500/10 text-red-600",
    },
    {
      key: "refunded",
      title: t("overview.transactionStatus.refunded"),
      icon: RefreshCw,
      className: "bg-slate-500/10 text-slate-600",
    },
  ] as const;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {statusConfig.map((status) => {
        const Icon = status.icon;

        return (
          <Card key={status.key}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`rounded-xl p-3 ${status.className}`}>
                <Icon className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm text-muted-foreground">{status.title}</p>

                <p className="text-2xl font-bold">{values[status.key]}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
