import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import Promo from "@/models/Promo";

import type {
  PromoErrorCode,
  PromoErrorResponse,
  PromoSuccessResponse,
} from "@/types/promo-errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CAMBODIA_TIME_ZONE = "Asia/Phnom_Penh";

/**
 * Return a consistent promotion error response.
 */
function promoError(error: string, code: PromoErrorCode, status: number) {
  const response: PromoErrorResponse = {
    success: false,
    error,
    code,
  };

  return NextResponse.json(response, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

/**
 * Validate YYYY-MM-DD without allowing JavaScript
 * to normalize invalid dates such as February 31.
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
 * Convert a stored promotion date into its Cambodia calendar-day
 * boundary.
 *
 * Date-only values are interpreted directly as Cambodia dates.
 * ISO timestamps are converted to their Cambodia calendar date.
 */
function getCambodiaDateBoundary(
  value: Date | string | null | undefined,
  isEndOfDay: boolean,
): Date | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  let dateString: string;

  // Handle date-only values directly.
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    if (!isValidDateOnly(value)) {
      return null;
    }

    dateString = value;
  } else {
    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
      return null;
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
      return null;
    }

    dateString = `${year}-${month}-${day}`;
  }

  return new Date(
    isEndOfDay
      ? `${dateString}T23:59:59.999+07:00`
      : `${dateString}T00:00:00.000+07:00`,
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Normalize promo code.
    const code =
      typeof body.code === "string" ? body.code.trim().toUpperCase() : "";

    const subtotal = Number(body.subtotal);

    // Validate promo code format.
    if (!/^[A-Z0-9_-]{3,30}$/.test(code)) {
      return promoError(
        "Please enter a valid promo code.",
        "PROMO_INVALID",
        400,
      );
    }

    // Validate subtotal.
    if (!Number.isFinite(subtotal) || subtotal <= 0) {
      return promoError("Your cart subtotal is invalid.", "PROMO_INVALID", 400);
    }

    await connectDB();

    // Find promotion.
    const promo = await Promo.findOne({ code }).lean();

    if (!promo) {
      return promoError(
        "This promo code does not exist.",
        "PROMO_INVALID",
        404,
      );
    }

    // Check active status.
    if (!promo.isActive) {
      return promoError("This promo code is inactive.", "PROMO_INACTIVE", 400);
    }

    // Normalize promotion dates using Cambodia calendar days.
    const now = new Date();

    const startDate = getCambodiaDateBoundary(promo.startDate, false);

    const endDate = getCambodiaDateBoundary(promo.endDate, true);

    // Reject invalid stored dates.
    if (promo.startDate && !startDate) {
      return promoError(
        "This promo code has an invalid start date.",
        "PROMO_INVALID_DATE",
        400,
      );
    }

    if (promo.endDate && !endDate) {
      return promoError(
        "This promo code has an invalid expiry date.",
        "PROMO_INVALID_DATE",
        400,
      );
    }

    // Ensure start date is not after end date.
    if (startDate && endDate && startDate > endDate) {
      return promoError(
        "This promo code has an invalid date range.",
        "PROMO_INVALID_DATE",
        400,
      );
    }

    // Check whether promotion has started.
    if (startDate && now < startDate) {
      return promoError(
        "This promo code is not available yet.",
        "PROMO_NOT_STARTED",
        400,
      );
    }

    // Check whether promotion has expired.
    // End date remains valid through 11:59:59.999 PM Cambodia time.
    if (endDate && now > endDate) {
      return promoError("This promo code has expired.", "PROMO_EXPIRED", 400);
    }

    // Validate minimum order.
    const minimumOrder = Number(promo.minimumOrder ?? 0);

    if (!Number.isFinite(minimumOrder) || minimumOrder < 0) {
      return promoError(
        "This promo code has an invalid minimum order amount.",
        "PROMO_INVALID",
        400,
      );
    }

    if (subtotal < minimumOrder) {
      return promoError(
        `Minimum order amount is $${minimumOrder.toFixed(2)}.`,
        "PROMO_MINIMUM_ORDER",
        400,
      );
    }

    // Check usage limit.
    if (
      promo.usageLimit !== null &&
      promo.usageLimit !== undefined &&
      promo.usedCount >= promo.usageLimit
    ) {
      return promoError(
        "This promo code has reached its usage limit.",
        "PROMO_LIMIT_REACHED",
        409,
      );
    }

    // Validate discount configuration.
    const discountValue = Number(promo.discountValue);

    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      return promoError(
        "This promo code has an invalid discount.",
        "PROMO_INVALID",
        400,
      );
    }

    if (promo.discountType !== "percentage" && promo.discountType !== "fixed") {
      return promoError(
        "This promo code has an invalid discount type.",
        "PROMO_INVALID",
        400,
      );
    }

    if (promo.discountType === "percentage" && discountValue > 100) {
      return promoError(
        "The promo discount cannot exceed 100%.",
        "PROMO_INVALID",
        400,
      );
    }

    // Calculate discount on the server.
    const rawDiscount =
      promo.discountType === "percentage"
        ? (subtotal * discountValue) / 100
        : discountValue;

    // Discount cannot exceed subtotal.
    const discount = Math.min(subtotal, Math.round(rawDiscount * 100) / 100);

    // No tax.
    const total = Math.round((subtotal - discount) * 100) / 100;

    // Successful validation response.
    const response: PromoSuccessResponse = {
      success: true,
      valid: true,
      promoCode: promo.code,
      discountType: promo.discountType,
      discountValue,
      subtotal,
      discount,
      total,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    });
  } catch (error) {
    console.error("POST promo validation error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to validate promo code.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    );
  }
}
