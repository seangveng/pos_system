"use client";

import { useEffect, useRef, useState } from "react";

import {
  CalendarDays,
  Check,
  Copy,
  MoreVertical,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";

import { Button } from "../../../../../components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../../../components/ui/dropdown-menu";

import { useTranslation } from "@/hooks/use-translation";

import type { Promo } from "../types/promos";

interface PromoCardProps {
  promo: Promo;
  onEdit: (promo: Promo) => void;
  onDelete: (promo: Promo) => void;
  onToggle: (promo: Promo) => void | Promise<void>;
}

type PromoStatus =
  | "Active"
  | "Inactive"
  | "Scheduled"
  | "Expired"
  | "Limit reached";

// ======================================================
// DESCRIPTION TRANSLATION
// ======================================================

function getTranslatedPromoDescription(
  description: string | null | undefined,
  locale: string,
  t: (key: string) => string,
): string {
  const value = description?.trim();

  if (!value) {
    return t("promotions.card.noDescription");
  }

  // Keep the original description in English.
  if (locale !== "km") {
    return value;
  }

  // Match known descriptions without case sensitivity.
  const normalizedDescription = value.toLowerCase();

  const translations: Record<string, string> = {
    "summer sale": "promotions.descriptions.summerSale",
    "special discount": "promotions.descriptions.specialDiscount",
    "weekend promotion": "promotions.descriptions.weekendPromotion",
  };

  const translationKey = translations[normalizedDescription];

  // Translate only descriptions with an available translation.
  // Keep custom descriptions unchanged.
  return translationKey ? t(translationKey) : value;
}

// ======================================================
// DATE HELPERS
// ======================================================

function getCambodiaDateString(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Phnom_Penh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) return "";

  return `${year}-${month}-${day}`;
}

function getPromoDateString(
  value: string | Date | null | undefined,
): string | null {
  if (!value) return null;

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);

    const date = new Date(Date.UTC(year, month - 1, day));

    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      return null;
    }

    return value;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return getCambodiaDateString(date);
}

// ======================================================
// KHMER DATE FORMATTER
// ======================================================

/**
 * English: Nov 23, 2026
 * Khmer: ២៣ វិច្ឆិកា ២០២៦
 */
function formatPromoDate(
  value: string | Date | null | undefined,
  locale: string,
  t: (key: string) => string,
): string {
  const dateString = getPromoDateString(value);

  if (!dateString) {
    return value
      ? t("promotions.card.invalidDate")
      : t("promotions.card.noExpiry");
  }

  const [year, month, day] = dateString.split("-").map(Number);

  if (locale === "km") {
    const khmerMonths = [
      "មករា",
      "កុម្ភៈ",
      "មីនា",
      "មេសា",
      "ឧសភា",
      "មិថុនា",
      "កក្កដា",
      "សីហា",
      "កញ្ញា",
      "តុលា",
      "វិច្ឆិកា",
      "ធ្នូ",
    ];

    const toKhmerNumber = (number: number): string => {
      return String(number).replace(
        /\d/g,
        (digit) => "០១២៣៤៥៦៧៨៩"[Number(digit)],
      );
    };

    return `${toKhmerNumber(day)} ${khmerMonths[month - 1]} ${toKhmerNumber(year)}`;
  }

  const date = new Date(Date.UTC(year, month - 1, day));

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

// ======================================================
// PROMOTION STATUS
// ======================================================

function getPromoStatus(promo: Promo): PromoStatus {
  if (!promo.isActive) {
    return "Inactive";
  }

  const usedCount = Number(promo.usedCount) || 0;

  const usageLimit =
    promo.usageLimit === null || promo.usageLimit === undefined
      ? null
      : Number(promo.usageLimit);

  if (
    usageLimit !== null &&
    Number.isFinite(usageLimit) &&
    usedCount >= usageLimit
  ) {
    return "Limit reached";
  }

  const today = getCambodiaDateString(new Date());

  const startDate = getPromoDateString(promo.startDate);
  const endDate = getPromoDateString(promo.endDate);

  if (startDate && today < startDate) {
    return "Scheduled";
  }

  if (endDate && today > endDate) {
    return "Expired";
  }

  return "Active";
}

// ======================================================
// STATUS STYLES
// ======================================================

function getStatusStyles(status: PromoStatus): string {
  switch (status) {
    case "Active":
      return "bg-green-50 text-green-700";

    case "Scheduled":
      return "bg-blue-50 text-blue-700";

    case "Expired":
      return "bg-red-50 text-red-700";

    case "Limit reached":
      return "bg-orange-50 text-orange-700";

    case "Inactive":
    default:
      return "bg-gray-100 text-gray-500";
  }
}

// ======================================================
// COMPONENT
// ======================================================

export function PromoCard({
  promo,
  onEdit,
  onDelete,
  onToggle,
}: PromoCardProps) {
  const { t, locale } = useTranslation();

  const [copied, setCopied] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  // ======================================================
  // PROMOTION DATA
  // ======================================================

  const status = getPromoStatus(promo);

  const discountValue = Number(promo.discountValue) || 0;

  const discount =
    promo.discountType === "percentage"
      ? `${discountValue}% ${t("promotions.card.off")}`
      : `$${discountValue.toFixed(2)} ${t("promotions.card.off")}`;

  const usedCount = Number(promo.usedCount) || 0;

  const usageLimit =
    promo.usageLimit === null || promo.usageLimit === undefined
      ? null
      : Number(promo.usageLimit);

  const minimumOrder = Number(promo.minimumOrder) || 0;

  const translatedDescription = getTranslatedPromoDescription(
    promo.description,
    locale,
    t,
  );

  const translatedStatuses: Record<PromoStatus, string> = {
    Active: t("promotions.card.status.active"),
    Inactive: t("promotions.card.status.inactive"),
    Scheduled: t("promotions.card.status.scheduled"),
    Expired: t("promotions.card.status.expired"),
    "Limit reached": t("promotions.card.status.limitReached"),
  };

  // ======================================================
  // COPY PROMOTION CODE
  // ======================================================

  const copyCode = async () => {
    if (!promo.code) return;

    try {
      await navigator.clipboard.writeText(promo.code);

      setCopied(true);

      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }

      copyTimeoutRef.current = setTimeout(() => {
        setCopied(false);
        copyTimeoutRef.current = null;
      }, 1500);
    } catch (error) {
      console.error("Failed to copy promo code:", error);
    }
  };

  // ======================================================
  // TOGGLE PROMOTION STATUS
  // ======================================================

  const handleToggle = async () => {
    if (isUpdating || !promo.id) return;

    try {
      setIsUpdating(true);
      await onToggle(promo);
    } catch (error) {
      console.error("Failed to update promo status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <article
      className={`group overflow-hidden rounded-2xl border bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
        status === "Active" ? "border-gray-200" : "border-gray-200 opacity-90"
      }`}
    >
      <div className="h-1.5 bg-gradient-to-r from-teal-400 via-teal-500 to-cyan-500" />

      <div className="p-4">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2 py-1 text-[10px] font-semibold ${getStatusStyles(
                  status,
                )}`}
              >
                {translatedStatuses[status]}
              </span>

              {usageLimit !== null && (
                <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700">
                  {usedCount}/{usageLimit} {t("promotions.card.used")}
                </span>
              )}
            </div>

            {/* Promo Code */}
            <div className="flex min-w-0 items-center gap-2">
              <h3 className="truncate text-lg font-bold tracking-wide text-gray-900">
                {promo.code}
              </h3>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={copyCode}
                className="h-7 w-7 shrink-0 rounded-lg text-gray-400 hover:bg-teal-50 hover:text-teal-600"
                aria-label={t("promotions.card.copyCode", {
                  code: promo.code,
                })}
                title={t("promotions.card.copyPromoCode")}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>

          {/* Dropdown Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                aria-label={t("promotions.card.promotionActions")}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onEdit(promo)}>
                <Pencil className="mr-2 h-4 w-4" />
                {t("promotions.card.edit")}
              </DropdownMenuItem>

              <DropdownMenuItem
                disabled={isUpdating}
                onClick={() => void handleToggle()}
              >
                {promo.isActive
                  ? t("promotions.card.deactivate")
                  : t("promotions.card.activate")}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => onDelete(promo)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t("promotions.card.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Discount */}
        <div className="mb-4 rounded-xl bg-gray-50 p-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
            {t("promotions.card.discount")}
          </p>

          <p className="mt-1 text-xl font-bold text-teal-600">{discount}</p>
        </div>

        {/* Translated Description */}
        <p className="mb-4 min-h-[36px] text-xs leading-5 text-gray-500">
          {translatedDescription}
        </p>

        {/* Promotion Details */}
        <div className="space-y-2 border-t border-gray-100 pt-3">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-gray-500">
              <Users className="h-3.5 w-3.5" />
              {t("promotions.card.minimumOrder")}
            </span>

            <span className="font-semibold text-gray-800">
              {minimumOrder > 0
                ? `$${minimumOrder.toFixed(2)}`
                : t("promotions.card.noMinimum")}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-gray-500">
              <CalendarDays className="h-3.5 w-3.5" />
              {t("promotions.card.validUntil")}
            </span>

            <span className="font-semibold text-gray-800">
              {formatPromoDate(promo.endDate, locale, t)}
            </span>
          </div>
        </div>

        {/* Toggle Button */}
        <Button
          type="button"
          variant="outline"
          onClick={() => void handleToggle()}
          disabled={isUpdating}
          className={`mt-4 h-8 w-full rounded-xl text-xs ${
            promo.isActive
              ? "border-gray-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              : "border-teal-200 text-teal-600 hover:bg-teal-50"
          }`}
        >
          {isUpdating
            ? t("promotions.card.updating")
            : promo.isActive
              ? t("promotions.card.deactivatePromo")
              : t("promotions.card.activatePromo")}
        </Button>
      </div>
    </article>
  );
}
