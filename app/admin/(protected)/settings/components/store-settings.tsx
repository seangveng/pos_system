"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import {
  Building2,
  DollarSign,
  Mail,
  MapPin,
  Phone,
  Image as ImageIcon,
  Receipt,
  ShoppingBag,
  CreditCard,
  Upload,
  Trash2,
} from "lucide-react";

import { useTranslation } from "@/hooks/use-translation";

import type { StoreSettings as StoreSettingsType } from "../types/settings";

interface StoreSettingsProps {
  settings: StoreSettingsType;
  onChange: (
    field: keyof StoreSettingsType,
    value: string | number | boolean,
  ) => void;
  readOnly?: boolean;
  canEditLogo?: boolean;
}

export function StoreSettings({
  settings,
  onChange,
  readOnly = false,
  canEditLogo = !readOnly,
}: StoreSettingsProps) {
  const { t } = useTranslation();

  const [logoError, setLogoError] = useState("");
  const [logoLoading, setLogoLoading] = useState(false);

  return (
    <section className="space-y-4">
      {/* Store Information */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-100 p-4 sm:p-5 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
              <Building2 className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                {t("settings.store.information.title")}
              </h2>

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {t("settings.store.information.subtitle")}
              </p>
            </div>
          </div>
        </div>

        {readOnly && (
          <div className="mx-4 mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
            {t("settings.store.information.readOnlyNotice")}
          </div>
        )}

        <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
          <Field
            label={t("settings.store.fields.storeName")}
            icon={<Building2 className="h-4 w-4" />}
          >
            <input
              value={settings.storeName}
              onChange={(event) => onChange("storeName", event.target.value)}
              disabled={readOnly}
              placeholder={t("settings.store.placeholders.storeName")}
              className={inputClass}
            />
          </Field>

          <Field
            label={t("settings.store.fields.storeEmail")}
            icon={<Mail className="h-4 w-4" />}
          >
            <input
              type="email"
              value={settings.email}
              onChange={(event) => onChange("email", event.target.value)}
              disabled={readOnly}
              placeholder="hello@happybirds.com"
              className={inputClass}
            />
          </Field>

          <Field
            label={t("settings.store.fields.phoneNumber")}
            icon={<Phone className="h-4 w-4" />}
          >
            <input
              type="tel"
              value={settings.phone}
              onChange={(event) => onChange("phone", event.target.value)}
              disabled={readOnly}
              placeholder={t("settings.store.placeholders.phone")}
              className={inputClass}
            />
          </Field>

          <Field
            label={t("settings.store.fields.currency")}
            icon={<DollarSign className="h-4 w-4" />}
          >
            <select
              value={settings.currency}
              onChange={(event) =>
                onChange("currency", event.target.value as "USD" | "KHR")
              }
              disabled={readOnly}
              className={inputClass}
            >
              <option value="USD">{t("settings.store.currency.usd")}</option>

              <option value="KHR">{t("settings.store.currency.khr")}</option>
            </select>
          </Field>

          <Field
            label={t("settings.store.fields.storeAddress")}
            icon={<MapPin className="h-4 w-4" />}
            full
          >
            <textarea
              value={settings.address}
              onChange={(event) => onChange("address", event.target.value)}
              disabled={readOnly}
              rows={3}
              placeholder={t("settings.store.placeholders.address")}
              className={`${inputClass} h-auto min-h-20 resize-y py-3`}
            />
          </Field>

          {/* Company Logo Upload */}
          <Field
            label={t("settings.store.fields.companyLogo")}
            icon={<ImageIcon className="h-4 w-4" />}
            full
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-950">
                {settings.logo ? (
                  <img
                    src={settings.logo}
                    alt={t("settings.store.logo.previewAlt")}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                {canEditLogo && (
                  <label
                    className={`inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition ${
                      logoLoading
                        ? "cursor-not-allowed opacity-60"
                        : "cursor-pointer hover:bg-teal-700"
                    }`}
                  >
                    {logoLoading ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}

                    {logoLoading
                      ? t("settings.store.logo.processing")
                      : t("settings.store.logo.upload")}

                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      disabled={logoLoading}
                      className="hidden"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];

                        if (!file) return;

                        try {
                          setLogoError("");
                          setLogoLoading(true);

                          const imageData = await convertLogoToDataUrl(file);

                          onChange("logo", imageData);
                        } catch (error) {
                          setLogoError(
                            error instanceof Error
                              ? error.message
                              : t("settings.store.logo.errors.processFailed"),
                          );
                        } finally {
                          setLogoLoading(false);
                          event.target.value = "";
                        }
                      }}
                    />
                  </label>
                )}

                {canEditLogo && settings.logo && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange("logo", "");
                      setLogoError("");
                    }}
                    className="ml-2 inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/30"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {t("settings.store.logo.remove")}
                  </button>
                )}

                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  {t("settings.store.logo.hint")}
                </p>

                {logoError && (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {logoError}
                  </p>
                )}
              </div>
            </div>
          </Field>
        </div>
      </div>

      {/* Tax Configuration */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-100 p-4 sm:p-5 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {t("settings.store.tax.title")}
          </h2>

          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {t("settings.store.tax.subtitle")}
          </p>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <Toggle
            title={t("settings.store.tax.enable")}
            description={t("settings.store.tax.enableDescription")}
            checked={settings.taxEnabled}
            disabled={readOnly}
            onChange={(value) => onChange("taxEnabled", value)}
          />

          <div className="max-w-sm space-y-1.5">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {t("settings.store.tax.rate")}
            </label>

            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={settings.taxRate}
                onChange={(event) =>
                  onChange("taxRate", Number(event.target.value))
                }
                disabled={readOnly || !settings.taxEnabled}
                className={`${inputClass} pr-10`}
              />

              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                %
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Settings */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-100 p-4 sm:p-5 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
              <Receipt className="h-4 w-4" />
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                {t("settings.store.receipt.title")}
              </h2>

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {t("settings.store.receipt.subtitle")}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <Toggle
            title={t("settings.store.receipt.showLogo")}
            description={t("settings.store.receipt.showLogoDescription")}
            checked={settings.showLogoOnReceipt}
            disabled={readOnly}
            onChange={(value) => onChange("showLogoOnReceipt", value)}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {t("settings.store.receipt.footer")}
            </label>

            <textarea
              rows={3}
              value={settings.receiptFooter}
              onChange={(event) =>
                onChange("receiptFooter", event.target.value)
              }
              disabled={readOnly}
              placeholder={t("settings.store.receipt.footerPlaceholder")}
              className={`${inputClass} h-auto resize-y py-3`}
            />
          </div>
        </div>
      </div>

      {/* Orders & Payments */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-100 p-4 sm:p-5 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
              <ShoppingBag className="h-4 w-4" />
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                {t("settings.store.orders.title")}
              </h2>

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {t("settings.store.orders.subtitle")}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <Toggle
            title={t("settings.store.orders.onlineOrders")}
            description={t("settings.store.orders.onlineOrdersDescription")}
            checked={settings.allowOnlineOrders}
            disabled={readOnly}
            onChange={(value) => onChange("allowOnlineOrders", value)}
          />

          <div className="border-t border-gray-100 dark:border-gray-800" />

          <Toggle
            title={t("settings.store.orders.cashPayments")}
            description={t("settings.store.orders.cashPaymentsDescription")}
            checked={settings.allowCashPayments}
            disabled={readOnly}
            onChange={(value) => onChange("allowCashPayments", value)}
          />

          <div className="border-t border-gray-100 dark:border-gray-800" />

          <Toggle
            title={t("settings.store.orders.onlinePayments")}
            description={t("settings.store.orders.onlinePaymentsDescription")}
            checked={settings.allowOnlinePayments}
            disabled={readOnly}
            onChange={(value) => onChange("allowOnlinePayments", value)}
          />
        </div>
      </div>

      {readOnly && (
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-500 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400">
          <CreditCard className="h-4 w-4 shrink-0" />
          {t("settings.store.readOnlyFooter")}
        </div>
      )}
    </section>
  );
}

/**
 * Compress uploaded images into WebP data URLs.
 */
async function convertLogoToDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please select an image file.");
  }

  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    throw new Error("Only PNG, JPG, and WEBP images are supported.");
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Image must be smaller than 10 MB.");
  }

  const bitmap = await createImageBitmap(file);

  try {
    const maxSize = 512;

    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));

    const canvas = document.createElement("canvas");

    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Unable to process this image.");
    }

    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) {
            resolve(result);
          } else {
            reject(new Error("Unable to compress image."));
          }
        },
        "image/webp",
        0.82,
      );
    });

    if (blob.size > 500 * 1024) {
      throw new Error(
        "Compressed logo is too large. Please choose a simpler image.",
      );
    }

    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Unable to read image."));
        }
      };

      reader.onerror = () => reject(new Error("Unable to read image."));

      reader.readAsDataURL(blob);
    });
  } finally {
    bitmap.close();
  }
}

const inputClass =
  "h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:disabled:bg-gray-900";

function Field({
  label,
  icon,
  full = false,
  children,
}: {
  label: string;
  icon: ReactNode;
  full?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`min-w-0 space-y-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
        <span className="text-gray-400">{icon}</span>
        {label}
      </label>

      {children}
    </div>
  );
}

function Toggle({
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {title}
        </p>

        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked ? "bg-teal-600" : "bg-gray-300 dark:bg-gray-700"
        } disabled:cursor-not-allowed disabled:opacity-50`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition ${
            checked ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}
