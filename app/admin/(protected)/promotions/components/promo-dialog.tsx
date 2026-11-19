"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/use-translation";

import type {
  Promo,
  PromoDiscountType,
  CreatePromoInput,
  UpdatePromoInput,
} from "@/types/promos";

import { addPromo, updatePromo } from "../actions/promos";

interface PromoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promo: Promo | null;
  onSaved: () => void;
}

// ======================================================
// DATE HELPERS
// ======================================================

const CAMBODIA_TIME_ZONE = "Asia/Phnom_Penh";

/**
 * Convert an ISO date into Cambodia's calendar date.
 * Keeps the original date-only value unchanged.
 */
function formatCambodiaDate(value: string | null): string {
  if (!value) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CAMBODIA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    return "";
  }

  return `${year}-${month}-${day}`;
}

/**
 * Validate a date-only calendar value.
 */
function isValidDateOnly(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * Display the selected date using the app language.
 *
 * English: Nov 23, 2026
 * Khmer: ២៣ វិច្ឆិកា ២០២៦
 *
 * UTC prevents date-only values from shifting
 * into the previous or next day.
 */
function formatDisplayDate(value: string, locale: string): string {
  if (!value || !isValidDateOnly(value)) {
    return "";
  }

  const [year, month, day] = value.split("-").map(Number);

  return new Intl.DateTimeFormat(locale === "km" ? "km-KH" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

// ======================================================
// COMPONENT
// ======================================================

export function PromoDialog({
  open,
  onOpenChange,
  promo,
  onSaved,
}: PromoDialogProps) {
  const { t, locale } = useTranslation();

  const isEditing = Boolean(promo);

  // Form fields
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");

  const [discountType, setDiscountType] =
    useState<PromoDiscountType>("percentage");

  const [discountValue, setDiscountValue] = useState("");
  const [minimumOrder, setMinimumOrder] = useState("");
  const [usageLimit, setUsageLimit] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [isActive, setIsActive] = useState(true);

  // UI state
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // ======================================================
  // RESET / LOAD FORM
  // ======================================================

  useEffect(() => {
    if (!open) return;

    if (promo) {
      setCode(promo.code);
      setDescription(promo.description);

      setDiscountType(promo.discountType);
      setDiscountValue(String(promo.discountValue));

      setMinimumOrder(String(promo.minimumOrder));

      setUsageLimit(promo.usageLimit !== null ? String(promo.usageLimit) : "");

      setStartDate(formatCambodiaDate(promo.startDate));
      setEndDate(formatCambodiaDate(promo.endDate));

      setIsActive(promo.isActive);
    } else {
      setCode("");
      setDescription("");

      setDiscountType("percentage");

      setDiscountValue("");
      setMinimumOrder("");
      setUsageLimit("");

      setStartDate("");
      setEndDate("");

      setIsActive(true);
    }

    setError("");
  }, [open, promo]);

  // ======================================================
  // DIALOG CONTROL
  // ======================================================

  const handleDialogChange = (nextOpen: boolean) => {
    if (isSaving) return;

    onOpenChange(nextOpen);
  };

  // ======================================================
  // FORM SUBMISSION
  // ======================================================

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSaving) return;

    setError("");

    const normalizedCode = code.trim().toUpperCase();
    const normalizedDescription = description.trim();

    // Promo code validation
    if (!normalizedCode) {
      setError(t("promotions.dialog.errors.codeRequired"));
      return;
    }

    if (
      normalizedCode.length < 3 ||
      normalizedCode.length > 30 ||
      !/^[A-Z0-9_-]+$/.test(normalizedCode)
    ) {
      setError(t("promotions.dialog.errors.codeInvalid"));
      return;
    }

    // Description validation
    if (!normalizedDescription) {
      setError(t("promotions.dialog.errors.descriptionRequired"));
      return;
    }

    if (normalizedDescription.length > 200) {
      setError(t("promotions.dialog.errors.descriptionTooLong"));
      return;
    }

    // Discount validation
    const parsedDiscountValue = Number(discountValue);

    if (
      !discountValue.trim() ||
      !Number.isFinite(parsedDiscountValue) ||
      parsedDiscountValue <= 0
    ) {
      setError(t("promotions.dialog.errors.discountInvalid"));
      return;
    }

    if (discountType === "percentage" && parsedDiscountValue > 100) {
      setError(t("promotions.dialog.errors.discountTooHigh"));
      return;
    }

    // Minimum order validation
    const parsedMinimumOrder = minimumOrder.trim() ? Number(minimumOrder) : 0;

    if (!Number.isFinite(parsedMinimumOrder) || parsedMinimumOrder < 0) {
      setError(t("promotions.dialog.errors.minimumOrderInvalid"));
      return;
    }

    // Usage limit validation
    const parsedUsageLimit = usageLimit.trim() ? Number(usageLimit) : null;

    if (
      parsedUsageLimit !== null &&
      (!Number.isSafeInteger(parsedUsageLimit) || parsedUsageLimit <= 0)
    ) {
      setError(t("promotions.dialog.errors.usageLimitInvalid"));
      return;
    }

    // Date validation
    if (!startDate || !endDate) {
      setError(t("promotions.dialog.errors.datesRequired"));
      return;
    }

    if (!isValidDateOnly(startDate) || !isValidDateOnly(endDate)) {
      setError(t("promotions.dialog.errors.datesInvalid"));
      return;
    }

    const startTimestamp = new Date(
      `${startDate}T00:00:00.000+07:00`,
    ).getTime();

    const endTimestamp = new Date(`${endDate}T23:59:59.999+07:00`).getTime();

    if (!Number.isFinite(startTimestamp) || !Number.isFinite(endTimestamp)) {
      setError(t("promotions.dialog.errors.datesInvalid"));
      return;
    }

    if (endTimestamp < startTimestamp) {
      setError(t("promotions.dialog.errors.endDateBeforeStart"));
      return;
    }

    // Prepare API data
    const data: CreatePromoInput = {
      code: normalizedCode,
      description: normalizedDescription,

      discountType,
      discountValue: parsedDiscountValue,

      minimumOrder: parsedMinimumOrder,

      usageLimit: parsedUsageLimit,

      // Keep date-only values for the backend.
      // Backend handles Cambodia date boundaries.
      startDate,
      endDate,

      isActive,
    };

    // Save promotion
    try {
      setIsSaving(true);

      if (promo) {
        const updateData: UpdatePromoInput = {
          ...data,
          id: promo.id,
        };

        await updatePromo(promo.id, updateData);
      } else {
        await addPromo(data);
      }

      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("promotions.dialog.errors.saveFailed"),
      );
    } finally {
      setIsSaving(false);
    }
  };

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100%-24px)] overflow-y-auto rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? t("promotions.dialog.editTitle")
              : t("promotions.dialog.createTitle")}
          </DialogTitle>

          <DialogDescription>
            {isEditing
              ? t("promotions.dialog.editDescription")
              : t("promotions.dialog.createDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error */}
          {error && (
            <div
              role="alert"
              aria-live="polite"
              className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600"
            >
              {error}
            </div>
          )}

          {/* Promo Code */}
          <div className="space-y-1.5">
            <label
              htmlFor="promo-code"
              className="text-xs font-medium text-gray-700"
            >
              {t("promotions.dialog.promoCode")}
            </label>

            <Input
              id="promo-code"
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder={t("promotions.dialog.codePlaceholder")}
              className="h-10 rounded-xl uppercase"
              maxLength={30}
              required
              disabled={isSaving || isEditing}
            />

            {isEditing && (
              <p className="text-[10px] text-gray-500">
                {t("promotions.dialog.codeCannotChange")}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label
              htmlFor="promo-description"
              className="text-xs font-medium text-gray-700"
            >
              {t("promotions.dialog.description")}
            </label>

            <Input
              id="promo-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={t("promotions.dialog.descriptionPlaceholder")}
              className="h-10 rounded-xl"
              maxLength={200}
              required
              disabled={isSaving}
            />
          </div>

          {/* Discount Type and Value */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label
                htmlFor="promo-discount-type"
                className="text-xs font-medium text-gray-700"
              >
                {t("promotions.dialog.discountType")}
              </label>

              <select
                id="promo-discount-type"
                value={discountType}
                onChange={(event) =>
                  setDiscountType(event.target.value as PromoDiscountType)
                }
                disabled={isSaving}
                className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              >
                <option value="percentage">
                  {t("promotions.dialog.percentage")}
                </option>

                <option value="fixed">
                  {t("promotions.dialog.fixedAmount")}
                </option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="promo-discount-value"
                className="text-xs font-medium text-gray-700"
              >
                {t("promotions.dialog.discountValue")}
              </label>

              <Input
                id="promo-discount-value"
                type="number"
                min="0.01"
                max={discountType === "percentage" ? "100" : undefined}
                step="0.01"
                value={discountValue}
                onChange={(event) => setDiscountValue(event.target.value)}
                placeholder={discountType === "percentage" ? "10" : "20"}
                className="h-10 rounded-xl"
                required
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Minimum Order and Usage Limit */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label
                htmlFor="promo-minimum-order"
                className="text-xs font-medium text-gray-700"
              >
                {t("promotions.dialog.minimumOrder")}
              </label>

              <Input
                id="promo-minimum-order"
                type="number"
                min="0"
                step="0.01"
                value={minimumOrder}
                onChange={(event) => setMinimumOrder(event.target.value)}
                placeholder="0"
                className="h-10 rounded-xl"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="promo-usage-limit"
                className="text-xs font-medium text-gray-700"
              >
                {t("promotions.dialog.usageLimit")}
              </label>

              <Input
                id="promo-usage-limit"
                type="number"
                min="1"
                step="1"
                value={usageLimit}
                onChange={(event) => setUsageLimit(event.target.value)}
                placeholder={t("promotions.dialog.unlimited")}
                className="h-10 rounded-xl"
                disabled={isSaving}
              />

              <p className="text-[10px] text-gray-500">
                {t("promotions.dialog.unlimitedHint")}
              </p>
            </div>
          </div>

          {/* Start and End Dates */}
          <div className="grid grid-cols-2 gap-3">
            {/* Start Date */}
            <div className="space-y-1.5">
              <label
                htmlFor="promo-start-date"
                className="text-xs font-medium text-gray-700"
              >
                {t("promotions.dialog.startDate")}
              </label>

              <Input
                id="promo-start-date"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="h-10 rounded-xl"
                required
                disabled={isSaving}
              />

              {startDate && (
                <p className="text-xs font-medium text-teal-700">
                  {formatDisplayDate(startDate, locale)}
                </p>
              )}
            </div>

            {/* End Date */}
            <div className="space-y-1.5">
              <label
                htmlFor="promo-end-date"
                className="text-xs font-medium text-gray-700"
              >
                {t("promotions.dialog.endDate")}
              </label>

              <Input
                id="promo-end-date"
                type="date"
                min={startDate || undefined}
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="h-10 rounded-xl"
                required
                disabled={isSaving}
              />

              {endDate && (
                <p className="text-xs font-medium text-teal-700">
                  {formatDisplayDate(endDate, locale)}
                </p>
              )}
            </div>
          </div>

          {/* Active Status */}
          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-3">
            <div>
              <p className="text-sm font-medium text-gray-800">
                {t("promotions.dialog.activePromo")}
              </p>

              <p className="text-[10px] text-gray-500">
                {t("promotions.dialog.activePromoHint")}
              </p>
            </div>

            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              disabled={isSaving}
              className="h-4 w-4 accent-teal-600"
            />
          </label>

          {/* Actions */}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDialogChange(false)}
              disabled={isSaving}
              className="rounded-xl"
            >
              {t("promotions.dialog.cancel")}
            </Button>

            <Button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-teal-600 text-white hover:bg-teal-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("promotions.dialog.saving")}
                </>
              ) : isEditing ? (
                t("promotions.dialog.saveChanges")
              ) : (
                t("promotions.dialog.createPromo")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
