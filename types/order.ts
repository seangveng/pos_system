export type OrderChannel = "CUSTOMER" | "ADMIN";

export type OrderPaymentGateway =
  | "CASH"
  | "CARD"
  | "ABA"
  | "ACLEDA"
  | "KHQR"
  | "PAYPAL"
  | "STRIPE";

export type OrderPaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "COMPLETED"
  | "CANCELLED";

export interface OrderItem {
  productId: number;
  name: string;
  sku: string;
  category: string;
  image: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  subtotal: number;
}

export interface Order {
  _id?: string;
  orderNumber: string;
  channel: OrderChannel;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  storeId: string;
  items: OrderItem[];
  subtotal: number;
  regularDiscount: number;
  promoDiscount: number;
  promoCode: string | null;
  tax: number;
  total: number;
  currency: string;
  gateway: OrderPaymentGateway;
  paymentStatus: OrderPaymentStatus;
  orderStatus: OrderStatus;
  paidAt: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
