import {
  AppSettings,
  StoreSettings,
  NotificationSettings,
  AppearanceSettings,
} from "../types/settings";

export const SETTINGS_STORAGE_KEY = "pos-settings";
export const SETTINGS_UPDATED_EVENT = "pos-settings-updated";
export const SETTINGS_API_URL = "/api/admin/settings";

export const DEFAULT_SETTINGS: AppSettings = {
  store: {
    storeName: "BUN CHHEANG CAFE",
    logo: "",
    phone: "",
    email: "hello@bunchheangcafe.com",
    address: "",
    currency: "USD",
    taxEnabled: false,
    taxRate: 0,
    receiptFooter: "Thank you for support with BUN CHHEANG CAFE!",
    showLogoOnReceipt: true,
    allowOnlineOrders: true,
    allowCashPayments: true,
    allowOnlinePayments: true,
  },
  account: {
    fullName: "",
    email: "",
    phone: "",
  },
  notifications: {
    emailNotifications: true,
    orderNotifications: true,
    lowStockNotifications: true,
    promotionNotifications: false,
  },
  appearance: {
    compactMode: false,
    darkMode: false,
  },
};

function isBrowser() {
  return typeof window !== "undefined";
}

function dispatchSettingsUpdated() {
  if (!isBrowser()) return;

  window.dispatchEvent(new Event(SETTINGS_UPDATED_EVENT));
}

// ==========================================
// APPEARANCE
// ==========================================

export function applyTheme(darkMode: boolean) {
  if (typeof document === "undefined") return;

  document.documentElement.classList.toggle("dark", darkMode);
}

// ==========================================
// LOCAL SETTINGS
// ==========================================

export function getSettings(): AppSettings {
  if (!isBrowser()) return DEFAULT_SETTINGS;

  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);

    if (!stored) {
      localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify(DEFAULT_SETTINGS),
      );

      applyTheme(DEFAULT_SETTINGS.appearance.darkMode);

      return DEFAULT_SETTINGS;
    }

    const parsed = JSON.parse(stored);

    const settings: AppSettings = {
      ...DEFAULT_SETTINGS,
      ...parsed,
      store: {
        ...DEFAULT_SETTINGS.store,
        ...(parsed.store ?? {}),
      },
      account: {
        ...DEFAULT_SETTINGS.account,
        ...(parsed.account ?? {}),
      },
      notifications: {
        ...DEFAULT_SETTINGS.notifications,
        ...(parsed.notifications ?? {}),
      },
      appearance: {
        ...DEFAULT_SETTINGS.appearance,
        ...(parsed.appearance ?? {}),
      },
    };

    applyTheme(settings.appearance.darkMode);

    return settings;
  } catch (error) {
    applyTheme(DEFAULT_SETTINGS.appearance.darkMode);

    return DEFAULT_SETTINGS;
  }
}

export function saveLocalSettings(
  notifications: NotificationSettings,
  appearance: AppearanceSettings,
) {
  if (!isBrowser()) return;

  try {
    const current = getSettings();

    const updated: AppSettings = {
      ...current,
      notifications,
      appearance,
    };

    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));

    applyTheme(appearance.darkMode);
    dispatchSettingsUpdated();
  } catch (error) {
    throw error;
  }
}

export function resetLocalSettings() {
  if (!isBrowser()) return;

  const current = getSettings();

  const updated: AppSettings = {
    ...current,
    notifications: DEFAULT_SETTINGS.notifications,
    appearance: DEFAULT_SETTINGS.appearance,
  };

  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));

  applyTheme(DEFAULT_SETTINGS.appearance.darkMode);
  dispatchSettingsUpdated();
}

// ==========================================
// API RESPONSE HANDLER
// ==========================================

async function readApiResponse(response: Response) {
  const responseText = await response.text();

  let data: any = null;

  try {
    data = responseText ? JSON.parse(responseText) : null;
  } catch {}

  if (!response.ok || !data?.success) {
    throw new Error(
      data?.message ||
        data?.error ||
        `Request failed with status ${response.status}.`,
    );
  }

  return data;
}

// ==========================================
// GET STORE SETTINGS
// ==========================================

export async function getStoreSettings(): Promise<{
  settings: StoreSettings;
  account: AppSettings["account"];
  role: "OWNER" | "ADMIN";
}> {
  const response = await fetch(SETTINGS_API_URL, {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  });

  const data = await readApiResponse(response);

  return {
    settings: {
      ...DEFAULT_SETTINGS.store,
      ...data.settings,
    },
    account: {
      fullName: data.account?.name ?? "",
      email: data.account?.email ?? "",
      phone: data.account?.phone ?? "",
    },
    role: data.role,
  };
}

// ==========================================
// SAVE STORE SETTINGS
// OWNER ONLY
// ==========================================

export async function saveStoreSettings(
  settings: StoreSettings,
): Promise<StoreSettings> {
  const response = await fetch(SETTINGS_API_URL, {
    method: "PUT",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify(settings),
  });

  const data = await readApiResponse(response);

  return {
    ...DEFAULT_SETTINGS.store,
    ...data.settings,
  };
}

// ==========================================
// SAVE ACCOUNT SETTINGS
// OWNER and ADMIN
// ==========================================

export async function saveAccountSettings(
  account: AppSettings["account"],
): Promise<AppSettings["account"]> {
  const response = await fetch(SETTINGS_API_URL, {
    method: "PATCH",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify({
      name: account.fullName,
      phone: account.phone,
    }),
  });

  const data = await readApiResponse(response);

  return {
    fullName: data.account.name ?? "",
    email: data.account.email ?? "",
    phone: data.account.phone ?? "",
  };
}
