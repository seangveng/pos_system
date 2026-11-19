"use client";

import { RotateCcw, Save, LoaderCircle, Settings2 } from "lucide-react";

import { Button } from "../../../../../components/ui/button";

import { useTranslation } from "@/hooks/use-translation";

interface SettingsSaveBarProps {
  onSave: () => void | Promise<void>;
  onReset: () => void;
  saving?: boolean;
}

export function SettingsSaveBar({
  onSave,
  onReset,
  saving = false,
}: SettingsSaveBarProps) {
  const { t } = useTranslation();

  return (
    <div className="sticky bottom-3 z-30 mt-6">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white/95 shadow-xl shadow-gray-200/40 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/95 dark:shadow-black/20">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          {/* Information */}
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-teal-100 bg-teal-50 text-teal-600 dark:border-teal-900/50 dark:bg-teal-950/60 dark:text-teal-400">
              <Settings2 className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {t("settings.saveBar.title")}
              </h3>

              <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                {t("settings.saveBar.description")}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-2 border-t border-gray-100 pt-3 dark:border-gray-800 sm:border-0 sm:pt-0">
            <Button
              type="button"
              variant="outline"
              onClick={onReset}
              disabled={saving}
              className="h-10 flex-1 gap-2 rounded-xl border-gray-200 px-4 text-xs font-semibold text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 sm:flex-none"
            >
              <RotateCcw className="h-4 w-4" />
              {t("settings.saveBar.reset")}
            </Button>

            <Button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="h-10 flex-1 gap-2 rounded-xl bg-teal-600 px-5 text-xs font-semibold text-white shadow-sm shadow-teal-600/20 transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
            >
              {saving ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}

              {saving
                ? t("settings.saveBar.saving")
                : t("settings.saveBar.saveChanges")}
            </Button>
          </div>
        </div>

        {/* Saving Indicator */}
        {saving && (
          <div
            className="h-0.5 w-full overflow-hidden bg-teal-100 dark:bg-teal-950"
            role="status"
            aria-label={t("settings.saveBar.saving")}
          >
            <div className="h-full w-1/3 animate-pulse rounded-full bg-teal-600" />
          </div>
        )}
      </div>
    </div>
  );
}
