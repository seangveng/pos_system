"use client";

import { Check, Layout, Moon, Palette, Sun } from "lucide-react";

import { useTranslation } from "@/hooks/use-translation";

import type { AppearanceSettings as AppearanceSettingsType } from "../types/settings";

interface AppearanceSettingsProps {
  settings: AppearanceSettingsType;
  onChange: (field: keyof AppearanceSettingsType, value: boolean) => void;
}

export function AppearanceSettings({
  settings,
  onChange,
}: AppearanceSettingsProps) {
  const { t } = useTranslation();

  return (
    <section className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-100 p-4 dark:border-gray-800 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
            <Palette className="h-4 w-4" />
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {t("settings.appearance.title")}
            </h2>

            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t("settings.appearance.subtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="space-y-3 p-4 sm:p-5">
        {/* Dark Mode */}
        <button
          type="button"
          onClick={() => onChange("darkMode", !settings.darkMode)}
          aria-pressed={settings.darkMode}
          className={`w-full rounded-2xl border p-4 text-left transition-all ${
            settings.darkMode
              ? "border-teal-300 bg-teal-50/50 dark:border-teal-700 dark:bg-teal-950/40"
              : "border-gray-200 hover:border-teal-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:border-teal-800 dark:hover:bg-gray-800"
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  settings.darkMode
                    ? "bg-teal-600 text-white"
                    : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                }`}
              >
                {settings.darkMode ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t("settings.appearance.darkMode.title")}
                </p>

                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {t("settings.appearance.darkMode.description")}
                </p>
              </div>
            </div>

            <div
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                settings.darkMode
                  ? "border-teal-600 bg-teal-600 text-white"
                  : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800"
              }`}
            >
              {settings.darkMode && <Check className="h-3.5 w-3.5" />}
            </div>
          </div>
        </button>

        {/* Compact Mode */}
        <button
          type="button"
          onClick={() => onChange("compactMode", !settings.compactMode)}
          aria-pressed={settings.compactMode}
          className={`w-full rounded-2xl border p-4 text-left transition-all ${
            settings.compactMode
              ? "border-teal-300 bg-teal-50/50 dark:border-teal-700 dark:bg-teal-950/40"
              : "border-gray-200 hover:border-teal-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:border-teal-800 dark:hover:bg-gray-800"
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  settings.compactMode
                    ? "bg-teal-600 text-white"
                    : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                }`}
              >
                <Layout className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t("settings.appearance.compactMode.title")}
                </p>

                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {t("settings.appearance.compactMode.description")}
                </p>
              </div>
            </div>

            <div
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                settings.compactMode
                  ? "border-teal-600 bg-teal-600 text-white"
                  : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800"
              }`}
            >
              {settings.compactMode && <Check className="h-3.5 w-3.5" />}
            </div>
          </div>
        </button>
      </div>
    </section>
  );
}
