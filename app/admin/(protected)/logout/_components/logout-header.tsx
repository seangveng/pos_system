"use client";

import { LogOut } from "lucide-react";

import { useTranslation } from "@/hooks/use-translation";

export function LogoutHeader() {
  const { t } = useTranslation();

  return (
    <div className="mb-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
          <LogOut className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
            {t("logout.header.title")}
          </h1>

          <p className="truncate text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
            {t("logout.header.subtitle")}
          </p>
        </div>
      </div>
    </div>
  );
}
