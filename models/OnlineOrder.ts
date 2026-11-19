import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type OrderSource = "ONLINE" | "STAFF";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "COMPLETED"
  | "CANCELLED";

export type PaymentMethod =
  | "CASH"
  | "ABA"
  | "ACLEDA"
  | "KHQR"
  | "CARD"
  | "PAYPAL"
  | "STRIPE";

export type PaymentStatus = "UNPAID" | "PAID" | "FAILED" | "REFUNDED";

export interface IOrderItem {
  productId: number;
  name: string;
  sku?: string;
  category?: string;
  price: number;
  quantity: number;
  image?: string;
  size: string | null;
  color: string | null;
}

export interface IOrderCustomer {
  name: string;
  phone: string;
  address: string;
  notes?: string;
}

export interface IOnlineOrder extends Document {
  orderNumber: string;
  orderSource: OrderSource;
  createdBy: string | null;

  customer: IOrderCustomer;
  items: IOrderItem[];

  subtotal: number;
  discount: number;

  // Promo information
  promoCode: string | null;
  promoId: Types.ObjectId | null;

  tax: number;
  deliveryFee: number;
  total: number;

  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paidAt: Date | null;

  status: OrderStatus;
  cancelledAt: Date | null;
  stockRestoredAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

/* =========================================================
   ORDER ITEM SCHEMA
========================================================= */

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: {
      type: Number,
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    sku: {
      type: String,
      default: "",
    },

    category: {
      type: String,
      default: "",
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    image: {
      type: String,
      default: "",
    },

    size: {
      type: String,
      default: null,
    },

    color: {
      type: String,
      default: null,
    },
  },
  {
    _id: false,
  },
);

/* =========================================================
   CUSTOMER SCHEMA
========================================================= */

const OrderCustomerSchema = new Schema<IOrderCustomer>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    _id: false,
  },
);

/* =========================================================
   ONLINE ORDER SCHEMA
========================================================= */

const OnlineOrderSchema = new Schema<IOnlineOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    orderSource: {
      type: String,
      enum: ["ONLINE", "STAFF"],
      required: true,
      default: "ONLINE",
      index: true,
    },

    createdBy: {
      type: String,
      default: null,
    },

    customer: {
      type: OrderCustomerSchema,
      required: true,
    },

    items: {
      type: [OrderItemSchema],
      required: true,
      validate: {
        validator: (items: IOrderItem[]) => items.length > 0,
        message: "An order must contain at least one item.",
      },
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Store applied promo code for invoice history.
    promoCode: {
      type: String,
      default: null,
      trim: true,
      uppercase: true,
    },

    // Reference to original MongoDB promotion.
    promoId: {
      type: Schema.Types.ObjectId,
      ref: "Promo",
      default: null,
    },

    tax: {
      type: Number,
      default: 0,
      min: 0,
    },

    deliveryFee: {
      type: Number,
      default: 0,
      min: 0,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    paymentMethod: {
      type: String,
      enum: ["CASH", "ABA", "ACLEDA", "KHQR", "CARD", "PAYPAL", "STRIPE"],
      default: "CASH",
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["UNPAID", "PAID", "FAILED", "REFUNDED"],
      default: "UNPAID",
      required: true,
      index: true,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: [
        "PENDING",
        "CONFIRMED",
        "PROCESSING",
        "SHIPPED",
        "COMPLETED",
        "CANCELLED",
      ],
      default: "PENDING",
      required: true,
      index: true,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    stockRestoredAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

/* =========================================================
   DATABASE INDEXES
========================================================= */

// Latest orders and date-based listing.
OnlineOrderSchema.index({
  createdAt: -1,
});

// Paid/unpaid reports filtered by date.
OnlineOrderSchema.index({
  paymentStatus: 1,
  createdAt: -1,
});

// Order status reports filtered by date.
OnlineOrderSchema.index({
  status: 1,
  createdAt: -1,
});

// Online and staff order filtering.
OnlineOrderSchema.index({
  orderSource: 1,
  createdAt: -1,
});

// Customer order lookup.
OnlineOrderSchema.index({
  "customer.phone": 1,
});

// Promotion usage/history lookup.
OnlineOrderSchema.index({
  promoId: 1,
});

/* =========================================================
   MODEL EXPORT
========================================================= */

const OnlineOrder: Model<IOnlineOrder> =
  mongoose.models.OnlineOrder ||
  mongoose.model<IOnlineOrder>("OnlineOrder", OnlineOrderSchema);

export default OnlineOrder;
