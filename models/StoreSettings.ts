import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStoreSettings extends Document {
  storeName: string;
  logo: string;
  phone: string;
  email: string;
  address: string;

  currency: string;
  taxEnabled: boolean;
  taxRate: number;

  receiptFooter: string;
  showLogoOnReceipt: boolean;

  allowOnlineOrders: boolean;
  allowCashPayments: boolean;
  allowOnlinePayments: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const StoreSettingsSchema = new Schema<IStoreSettings>(
  {
    storeName: {
      type: String,
      default: "Happy Birds",
      trim: true,
    },
    logo: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    email: {
      type: String,
      default: "",
      trim: true,
    },
    address: {
      type: String,
      default: "",
      trim: true,
    },

    currency: {
      type: String,
      default: "USD",
      enum: ["USD", "KHR"],
    },
    taxEnabled: {
      type: Boolean,
      default: false,
    },
    taxRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    receiptFooter: {
      type: String,
      default: "Thank you for support with BUN CHHEANG CAFE!",
    },
    showLogoOnReceipt: {
      type: Boolean,
      default: true,
    },

    allowOnlineOrders: {
      type: Boolean,
      default: true,
    },
    allowCashPayments: {
      type: Boolean,
      default: true,
    },
    allowOnlinePayments: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

const StoreSettings: Model<IStoreSettings> =
  mongoose.models.StoreSettings ||
  mongoose.model<IStoreSettings>("StoreSettings", StoreSettingsSchema);

export default StoreSettings;
