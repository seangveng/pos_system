"use client";

import { useCallback, useEffect, useState } from "react";

import type { AppSettings } from "../types/settings";

import { SettingsHeader } from "./settings-header";
import { SettingsNavigation } from "./settings-navigation";
import { StoreSettings } from "./store-settings";
import { AccountSettings } from "./account-settings";
import { NotificationSettings } from "./notification-settings";
import { AppearanceSettings } from "./appearance-settings";
import { SettingsSaveBar } from "./settings-save-bar";
import { TeamManagement } from "./team-management";

import {
  DEFAULT_SETTINGS,
  getSettings,
  getStoreSettings,
  saveLocalSettings,
  saveStoreSettings,
  saveAccountSettings,
} from "../actions/settings";

type UserRole = "OWNER" | "ADMIN";

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [initialSettings, setInitialSettings] = useState<AppSettings | null>(
    null,
  );

  const [role, setRole] = useState<UserRole | null>(null);
  const [activeSection, setActiveSection] = useState("store");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const localSettings = getSettings();
      const remote = await getStoreSettings();

      const loadedSettings: AppSettings = {
        ...localSettings,
        store: remote.settings,
        account: remote.account,
      };

      setSettings(loadedSettings);
      setInitialSettings(loadedSettings);
      setRole(remote.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const updateStore = (
    field: keyof AppSettings["store"],
    value: string | number | boolean,
  ) => {
    setSettings((previous) => {
      if (!previous) return previous;

      return {
        ...previous,
        store: {
          ...previous.store,
          [field]: value,
        },
      };
    });
  };

  const updateAccount = (
    field: keyof AppSettings["account"],
    value: string,
  ) => {
    setSettings((previous) => {
      if (!previous) return previous;

      return {
        ...previous,
        account: {
          ...previous.account,
          [field]: value,
        },
      };
    });
  };

  const updateNotifications = (
    field: keyof AppSettings["notifications"],
    value: boolean,
  ) => {
    setSettings((previous) => {
      if (!previous) return previous;

      return {
        ...previous,
        notifications: {
          ...previous.notifications,
          [field]: value,
        },
      };
    });
  };

  const updateAppearance = (
    field: keyof AppSettings["appearance"],
    value: boolean,
  ) => {
    setSettings((previous) => {
      if (!previous) return previous;

      const updated = {
        ...previous,
        appearance: {
          ...previous.appearance,
          [field]: value,
        },
      };

      if (field === "darkMode") {
        document.documentElement.classList.toggle("dark", value);
      }

      return updated;
    });
  };

  const saveAdminLogo = async (logo: string) => {
    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      credentials: "include",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ logo }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to update company logo.");
    }

    return data.settings;
  };

  const handleSave = async () => {
    if (!settings || !initialSettings || !role) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      let savedSettings = { ...settings };

      const storeChanged =
        JSON.stringify(settings.store) !==
        JSON.stringify(initialSettings.store);

      const logoChanged = settings.store.logo !== initialSettings.store.logo;

      const accountChanged =
        settings.account.fullName !== initialSettings.account.fullName ||
        settings.account.phone !== initialSettings.account.phone;

      // OWNER can save all store settings.
      if (storeChanged && role === "OWNER") {
        const updatedStore = await saveStoreSettings(settings.store);

        savedSettings = {
          ...savedSettings,
          store: updatedStore,
        };

        window.dispatchEvent(new Event("store-settings-updated"));
      }

      // ADMIN can save ONLY the company logo.
      if (logoChanged && role === "ADMIN") {
        const updatedStore = await saveAdminLogo(settings.store.logo);

        savedSettings = {
          ...savedSettings,
          store: {
            ...savedSettings.store,
            ...updatedStore,
          },
        };

        window.dispatchEvent(new Event("store-settings-updated"));
      }

      // Save the logged-in user's profile.
      if (accountChanged) {
        const updatedAccount = await saveAccountSettings(settings.account);

        savedSettings = {
          ...savedSettings,
          account: updatedAccount,
        };
      }

      // Save notification and appearance preferences locally.
      saveLocalSettings(settings.notifications, settings.appearance);

      setSettings(savedSettings);
      setInitialSettings(savedSettings);
      setSuccess("Settings saved successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!initialSettings) return;

    const resetSettings: AppSettings = {
      ...initialSettings,
      notifications: DEFAULT_SETTINGS.notifications,
      appearance: DEFAULT_SETTINGS.appearance,
    };

    setSettings(resetSettings);

    document.documentElement.classList.remove("dark");

    saveLocalSettings(
      DEFAULT_SETTINGS.notifications,
      DEFAULT_SETTINGS.appearance,
    );

    setError("");
    setSuccess("Local preferences have been reset.");
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
          Loading settings...
        </div>
      </div>
    );
  }

  if (!settings || !role) {
    return (
      <div className="mx-auto max-w-6xl rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950/30">
        <p className="text-sm font-medium text-red-700 dark:text-red-400">
          {error || "Unable to load settings."}
        </p>

        <button
          type="button"
          onClick={() => void loadSettings()}
          className="mt-3 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <SettingsHeader />

      <SettingsNavigation
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-xl border border-teal-200 bg-teal-50 p-3 text-sm text-teal-700 dark:border-teal-900 dark:bg-teal-950/30 dark:text-teal-400">
          {success}
        </div>
      )}

      <div className="space-y-4">
        {activeSection === "store" && (
          <StoreSettings
            settings={settings.store}
            onChange={updateStore}
            readOnly={role !== "OWNER"}
            canEditLogo={role === "OWNER" || role === "ADMIN"}
          />
        )}

        {activeSection === "account" && (
          <AccountSettings
            settings={settings.account}
            onChange={updateAccount}
          />
        )}

        {activeSection === "team" && <TeamManagement currentRole={role} />}

        {activeSection === "notifications" && (
          <NotificationSettings
            settings={settings.notifications}
            onChange={updateNotifications}
          />
        )}

        {activeSection === "appearance" && (
          <AppearanceSettings
            settings={settings.appearance}
            onChange={updateAppearance}
          />
        )}
      </div>

      {activeSection !== "team" && (
        <SettingsSaveBar
          onSave={handleSave}
          onReset={handleReset}
          saving={saving}
        />
      )}
    </div>
  );
}
