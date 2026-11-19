export type PromoErrorCode =
  | "PROMO_INVALID"
  | "PROMO_INVALID_DATE"
  | "PROMO_INACTIVE"
  | "PROMO_NOT_STARTED"
  | "PROMO_EXPIRED"
  | "PROMO_MINIMUM_ORDER"
  | "PROMO_LIMIT_REACHED";

export interface PromoErrorResponse {
  success: false;
  error: string;
  code: PromoErrorCode;
}

export interface PromoSuccessResponse {
  success: true;
  valid: true;
  promoCode: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  subtotal: number;
  discount: number;
  total: number;
}
