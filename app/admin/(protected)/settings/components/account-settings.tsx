"use client";

import { Mail, User, Phone } from "lucide-react";

import type { AccountSettings as AccountSettingsType } from "../types/settings";

import { Input } from "../../../../../components/ui/input";
import { useTranslation } from "@/hooks/use-translation";

interface AccountSettingsProps {
  settings: AccountSettingsType;
  onChange: (field: keyof AccountSettingsType, value: string) => void;
}

export function AccountSettings({ settings, onChange }: AccountSettingsProps) {
  const { t } = useTranslation();

  return (
    <section className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="border-b border-gray-100 p-4 dark:border-gray-800 sm:p-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          {t("settings.account.title")}
        </h2>

        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {t("settings.account.subtitle")}
        </p>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex items-center gap-3 rounded-xl bg-teal-50/60 p-3 dark:bg-teal-950/30">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">
            {settings.fullName
              ? settings.fullName.charAt(0).toUpperCase()
              : "U"}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
              {settings.fullName || t("settings.account.placeholders.name")}
            </p>

            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
              {settings.email || t("settings.account.placeholders.noEmail")}
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
              <User className="h-3.5 w-3.5 text-gray-400" />
              {t("settings.account.fields.fullName")}
            </label>

            <Input
              value={settings.fullName}
              onChange={(event) => onChange("fullName", event.target.value)}
              placeholder={t("settings.account.placeholders.fullName")}
              maxLength={100}
              className="h-10 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
              <Phone className="h-3.5 w-3.5 text-gray-400" />
              {t("settings.account.fields.phone")}
            </label>

            <Input
              type="tel"
              value={settings.phone}
              onChange={(event) => onChange("phone", event.target.value)}
              placeholder={t("settings.account.placeholders.phone")}
              maxLength={30}
              className="h-10 rounded-xl"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
              <Mail className="h-3.5 w-3.5 text-gray-400" />
              {t("settings.account.fields.email")}
            </label>

            <Input
              type="email"
              value={settings.email}
              readOnly
              className="h-10 rounded-xl bg-gray-50 text-gray-500 dark:bg-gray-950 dark:text-gray-400"
            />

            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {t("settings.account.emailHint")}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-950">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {t("settings.account.saveNotice")}
          </p>
        </div>
      </div>
    </section>
  );
}
