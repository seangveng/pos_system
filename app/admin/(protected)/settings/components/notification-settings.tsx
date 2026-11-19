"use client";

import { Bell, Mail, Package, ShoppingCart, Tag } from "lucide-react";

import { useTranslation } from "@/hooks/use-translation";

import type { NotificationSettings as NotificationSettingsType } from "../types/settings";

interface NotificationSettingsProps {
  settings: NotificationSettingsType;
  onChange: (field: keyof NotificationSettingsType, value: boolean) => void;
}

const notificationItems = [
  {
    key: "emailNotifications",
    titleKey: "settings.notifications.items.email.title",
    descriptionKey: "settings.notifications.items.email.description",
    icon: Mail,
  },
  {
    key: "orderNotifications",
    titleKey: "settings.notifications.items.orders.title",
    descriptionKey: "settings.notifications.items.orders.description",
    icon: ShoppingCart,
  },
  {
    key: "lowStockNotifications",
    titleKey: "settings.notifications.items.lowStock.title",
    descriptionKey: "settings.notifications.items.lowStock.description",
    icon: Package,
  },
  {
    key: "promotionNotifications",
    titleKey: "settings.notifications.items.promotions.title",
    descriptionKey: "settings.notifications.items.promotions.description",
    icon: Tag,
  },
] as const;

export function NotificationSettings({
  settings,
  onChange,
}: NotificationSettingsProps) {
  const { t } = useTranslation();

  return (
    <section className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="border-b border-gray-100 p-4 sm:p-5 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
            <Bell className="h-4 w-4" />
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {t("settings.notifications.title")}
            </h2>

            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t("settings.notifications.subtitle")}
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {notificationItems.map((item) => {
          const Icon = item.icon;
          const checked = settings[item.key];

          const title = t(item.titleKey);

          return (
            <div
              key={item.key}
              className="flex items-center justify-between gap-4 p-4 sm:p-5"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  <Icon className="h-4 w-4" />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {title}
                  </p>

                  <p className="mt-0.5 text-xs leading-5 text-gray-500 dark:text-gray-400">
                    {t(item.descriptionKey)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-label={title}
                aria-checked={checked}
                onClick={() => onChange(item.key, !checked)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  checked ? "bg-teal-600" : "bg-gray-300 dark:bg-gray-700"
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                    checked ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
