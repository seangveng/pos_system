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
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreatePromoInput {
  code: string;
  description: string;
  discountType: PromoDiscountType;
  discountValue: number;
  minimumOrder: number;
  usageLimit: number | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export type UpdatePromoInput = Partial<CreatePromoInput>;
