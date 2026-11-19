import { Schema, model, models } from "mongoose";

const CategorySchema = new Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    color: {
      type: String,
      required: true,
      default: "#14b8a6",
    },
  },
  {
    timestamps: true,
  },
);

const Category = models.Category || model("Category", CategorySchema);

export default Category;
