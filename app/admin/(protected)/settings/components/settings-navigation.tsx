"use client";

import { Store, User, Bell, Palette, Users } from "lucide-react";

import { useTranslation } from "@/hooks/use-translation";

interface SettingsNavigationProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const navigationItems = [
  {
    id: "store",
    translationKey: "settings.navigation.store",
    icon: Store,
  },
  {
    id: "account",
    translationKey: "settings.navigation.account",
    icon: User,
  },
  {
    id: "team",
    translationKey: "settings.navigation.team",
    icon: Users,
  },
  {
    id: "notifications",
    translationKey: "settings.navigation.notifications",
    icon: Bell,
  },
  {
    id: "appearance",
    translationKey: "settings.navigation.appearance",
    icon: Palette,
  },
];

export function SettingsNavigation({
  activeSection,
  setActiveSection,
}: SettingsNavigationProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-5 overflow-x-auto rounded-2xl border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-gray-900">
      <nav
        className="flex min-w-max gap-1"
        aria-label={t("settings.navigation.ariaLabel")}
      >
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSection(item.id)}
              aria-current={active ? "page" : undefined}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium transition sm:px-4 ${
                active
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t(item.translationKey)}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
