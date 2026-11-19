export type PaymentGateway =
  | "CASH"
  | "CARD"
  | "ABA"
  | "ACLEDA"
  | "KHQR"
  | "PAYPAL"
  | "STRIPE";

export type TransactionStatus =
  | "PAID"
  | "PENDING"
  | "FAILED"
  | "REFUNDED"
  | "CANCELLED";

export interface TransactionItem {
  id: string | number;
  name: string;
  quantity: number;
  price: number;
  size?: string;
  color?: string;
  image?: string;
  category?: string;
}

export interface Transaction {
  id: string;

  storeId: string;

  customerName: string;

  amount: number;

  currency: string;

  gateway: PaymentGateway;

  status: TransactionStatus;

  createdAt: string;

  paidAt: string | null;

  subtotal: number;

  regularDiscount: number;

  promoDiscount: number;

  promoCode: string | null;

  tax: number;

  total: number;

  itemCount: number;

  items: TransactionItem[];
}
