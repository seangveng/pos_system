"use client";

import { Settings as SettingsIcon } from "lucide-react";

import { useTranslation } from "@/hooks/use-translation";

export function SettingsHeader() {
  const { t } = useTranslation();

  return (
    <div className="mb-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
          <SettingsIcon className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-gray-900 sm:text-2xl">
            {t("settings.header.title")}
          </h1>

          <p className="truncate text-xs text-gray-500 sm:text-sm">
            {t("settings.header.subtitle")}
          </p>
        </div>
      </div>
    </div>
  );
}
