export interface StoreSettings {
  storeName: string;
  logo: string;
  phone: string;
  email: string;
  address: string;

  currency: "USD" | "KHR";
  taxEnabled: boolean;
  taxRate: number;

  receiptFooter: string;
  showLogoOnReceipt: boolean;

  allowOnlineOrders: boolean;
  allowCashPayments: boolean;
  allowOnlinePayments: boolean;
}

export interface AccountSettings {
  fullName: string;
  email: string;
  phone: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  orderNotifications: boolean;
  lowStockNotifications: boolean;
  promotionNotifications: boolean;
}

export interface AppearanceSettings {
  compactMode: boolean;
  darkMode: boolean;
}

export interface AppSettings {
  store: StoreSettings;
  account: AccountSettings;
  notifications: NotificationSettings;
  appearance: AppearanceSettings;
}
