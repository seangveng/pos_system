export type PromoDiscountType = "percentage" | "fixed";

export interface Promo {
  id: string;

  code: string;
  description: string;

  discountType: PromoDiscountType;
  discountValue: number;

  minimumOrder: number;

  usageLimit: number | null;
  usedCount: number;

  startDate: string | null;
  endDate: string | null;

  isActive: boolean;

  createdAt?: string;
  updatedAt?: string;
}

// ======================================================
// CREATE PROMOTION
// ======================================================

export interface CreatePromoInput {
  code: string;
  description: string;

  discountType: PromoDiscountType;
  discountValue: number;

  minimumOrder: number;

  usageLimit: number | null;

  startDate: string | null;
  endDate: string | null;

  isActive: boolean;
}

// ======================================================
// UPDATE PROMOTION
// ======================================================

export interface UpdatePromoInput extends CreatePromoInput {
  id: string;
}

// ======================================================
// PROMOTION API RESPONSE
// ======================================================

export interface PromoApiResponse {
  success?: boolean;
  message?: string;
  error?: string;

  promo?: Promo;
  promos?: Promo[];
}

// ======================================================
// PROMOTION VALIDATION RESPONSE
// ======================================================

export interface PromoValidationSuccess {
  success: true;
  valid: true;

  promoCode: string;

  discountType: PromoDiscountType;
  discountValue: number;

  subtotal: number;
  discount: number;
  total: number;
}

export interface PromoValidationError {
  success: false;
  error: string;

  code:
    | "PROMO_INVALID"
    | "PROMO_INVALID_DATE"
    | "PROMO_INACTIVE"
    | "PROMO_NOT_STARTED"
    | "PROMO_EXPIRED"
    | "PROMO_MINIMUM_ORDER"
    | "PROMO_LIMIT_REACHED";
}

export type PromoValidationResponse =
  | PromoValidationSuccess
  | PromoValidationError;
