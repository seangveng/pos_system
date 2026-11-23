import mongoose, { Schema, type Document, type Model } from "mongoose";

export type PromoDiscountType = "percentage" | "fixed";

export interface IPromo extends Document {
  code: string;
  description: string;

  discountType: PromoDiscountType;
  discountValue: number;

  minimumOrder: number;

  usageLimit: number | null;
  usedCount: number;

  startDate: Date | null;
  endDate: Date | null;

  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const PromoSchema = new Schema<IPromo>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      minlength: 3,
      maxlength: 30,
      match: /^[A-Z0-9_-]+$/,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },

    discountValue: {
      type: Number,
      required: true,
      min: 0.01,
    },

    minimumOrder: {
      type: Number,
      default: 0,
      min: 0,
    },

    // null means unlimited usage.
    usageLimit: {
      type: Number,
      default: null,
      min: 1,
    },

    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // null means no start-date restriction.
    startDate: {
      type: Date,
      default: null,
    },

    // null means no expiration date.
    endDate: {
      type: Date,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// ============================================================
// CUSTOM VALIDATION
// ============================================================

// Percentage discounts cannot exceed 100%.
PromoSchema.pre("validate", function () {
  if (this.discountType === "percentage" && this.discountValue > 100) {
    this.invalidate("discountValue", "Percentage discount cannot exceed 100%.");
  }
});

// ============================================================
// MODEL
// ============================================================

const Promo: Model<IPromo> =
  mongoose.models.Promo || mongoose.model<IPromo>("Promo", PromoSchema);

export default Promo;
