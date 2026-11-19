import { Schema, model, models } from "mongoose";

const OrderItemSchema = new Schema(
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
    image: {
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
    size: {
      type: String,
      default: "",
    },
    color: {
      type: String,
      default: "",
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false },
);

const OrderSchema = new Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    channel: {
      type: String,
      enum: ["CUSTOMER", "ADMIN"],
      required: true,
      index: true,
    },

    customerName: {
      type: String,
      required: true,
      trim: true,
      default: "Walk-in Customer",
    },

    customerPhone: {
      type: String,
      trim: true,
      default: "",
    },

    customerEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    storeId: {
      type: String,
      default: "CAFE-BC",
    },

    items: {
      type: [OrderItemSchema],
      required: true,
      validate: {
        validator: (items: unknown[]) =>
          Array.isArray(items) && items.length > 0,
        message: "An order must contain at least one product.",
      },
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    regularDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },

    promoDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },

    promoCode: {
      type: String,
      default: null,
    },

    tax: {
      type: Number,
      default: 0,
      min: 0,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "USD",
    },

    gateway: {
      type: String,
      enum: ["CASH", "CARD", "ABA", "ACLEDA", "KHQR", "PAYPAL", "STRIPE"],
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
      default: "PENDING",
      index: true,
    },

    orderStatus: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "PROCESSING", "COMPLETED", "CANCELLED"],
      default: "PENDING",
      index: true,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ paymentStatus: 1, orderStatus: 1 });

const Order = models.Order || model("Order", OrderSchema);

export default Order;
