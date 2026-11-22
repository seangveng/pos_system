"use client";

import { memo, useState } from "react";
import { ShoppingCart, Star, ImageOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCartDispatch } from "../../../../../contexts/cart-context";
import { useTranslation } from "@/hooks/use-translation";
import type { Products } from "../_type/products";

interface ProductCardProps {
  product: Products;
  priority?: boolean;
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const SIZE_TRANSLATION_KEYS: Record<string, string> = {
  small: "products.options.sizes.small",
  medium: "products.options.sizes.medium",
  large: "products.options.sizes.large",
  xl: "products.options.sizes.xl",
  xxl: "products.options.sizes.xxl",
};

const COLOR_TRANSLATION_KEYS: Record<string, string> = {
  red: "products.options.colors.red",
  blue: "products.options.colors.blue",
  black: "products.options.colors.black",
  white: "products.options.colors.white",
  green: "products.options.colors.green",
  yellow: "products.options.colors.yellow",
  pink: "products.options.colors.pink",
  purple: "products.options.colors.purple",
  orange: "products.options.colors.orange",
  brown: "products.options.colors.brown",
};

const CATEGORY_TRANSLATION_KEYS: Record<string, string> = {
  all: "categories.all",

  drink: "categories.drinks",
  drinks: "categories.drinks",
  beverage: "categories.drinks",
  beverages: "categories.drinks",

  cake: "categories.cakes",
  cakes: "categories.cakes",

  bakery: "categories.bakery",

  beer: "categories.beers",
  beers: "categories.beers",

  softdrink: "categories.softDrinks",
  softdrinks: "categories.softDrinks",

  snack: "categories.snacks",
  snacks: "categories.snacks",

  water: "categories.water",

  juice: "categories.juice",
  juices: "categories.juice",
};

function normalizeTranslationValue(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function ProductCard({ product, priority = false }: ProductCardProps) {
  const dispatch = useCartDispatch();
  const { t } = useTranslation();

  const sizes = Array.isArray(product.sizes) ? product.sizes : [];
  const colors = Array.isArray(product.colors) ? product.colors : [];

  const [selectedSize, setSelectedSize] = useState(sizes[0] ?? "");
  const [selectedColor, setSelectedColor] = useState(colors[0] ?? "");
  const [imageError, setImageError] = useState(false);

  const price = Number(product.price) || 0;
  const rating = Math.max(0, Math.min(5, Number(product.rating) || 0));

  const imageSrc =
    typeof product.image === "string" ? product.image.trim() : "";

  const translateSize = (size: string): string => {
    const normalized = normalizeTranslationValue(size);
    const key = SIZE_TRANSLATION_KEYS[normalized];

    return key ? t(key) : size;
  };

  const translateColor = (color: string): string => {
    const normalized = normalizeTranslationValue(color);
    const key = COLOR_TRANSLATION_KEYS[normalized];

    return key ? t(key) : color;
  };

  const translateCategory = (category: string): string => {
    const normalized = normalizeTranslationValue(category);
    const key = CATEGORY_TRANSLATION_KEYS[normalized];

    if (!key) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `[ProductCard] Category has no translation mapping: "${category}"`,
        );
      }

      return category;
    }

    const translated = t(key);

    if (translated === key) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `[ProductCard] Translation key missing in locale JSON: "${key}"`,
        );
      }

      return category;
    }

    return translated;
  };

  const handleAddToCart = () => {
    dispatch({
      type: "ADD_ITEM",
      payload: {
        id: product.id,
        name: product.name,
        category: product.category,
        price,
        image: imageSrc,
        size: selectedSize,
        color: selectedColor,
      },
    });

    dispatch({ type: "OPEN_CART" });
  };

  return (
    <article className="flex h-full w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
      {/* Product image */}
      <div className="w-full p-3 pb-0 sm:p-4 sm:pb-0">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-gray-100">
          {imageSrc && !imageError ? (
            <img
              src={imageSrc}
              alt={product.name || "Product"}
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "auto"}
              decoding="async"
              onError={() => setImageError(true)}
              className="absolute inset-0 h-full w-full rounded-xl object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex h-full w-full flex-col items-center justify-center gap-2 rounded-xl bg-gray-100 text-gray-400">
              <ImageOff className="h-8 w-8" />
              <span className="text-xs">{t("products.imageUnavailable")}</span>
            </div>
          )}

          {product.category && (
            <span className="absolute left-2 top-2 max-w-[80%] truncate rounded-full border border-gray-100 bg-white/95 px-2.5 py-1 text-[10px] font-medium text-gray-600 shadow-sm sm:text-xs">
              {translateCategory(product.category)}
            </span>
          )}
        </div>
      </div>

      {/* Product details */}
      <div className="flex min-w-0 flex-1 flex-col p-2 sm:p-4">
        <h3
          title={product.name}
          className="line-clamp-2 min-h-10 break-words text-sm font-semibold leading-5 text-gray-900 sm:text-base"
        >
          {product.name}
        </h3>

        {/* Rating */}
        <div className=" flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }, (_, index) => (
              <Star
                key={index}
                className={`h-3.5 w-3.5 shrink-0 ${
                  index < Math.floor(rating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>

          <span className="text-xs text-gray-500">{rating.toFixed(1)}</span>
        </div>

        {/* Size options */}
        {sizes.length > 0 && (
          <div className="mt-3 min-w-0">
            <p className="mb-1.5 text-xs font-medium text-gray-500">
              {t("cart.size")}
            </p>

            <div className="flex flex-wrap gap-1.5">
              {sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  aria-pressed={selectedSize === size}
                  className={`min-h-8 rounded-lg border px-2.5 text-xs transition-colors ${
                    selectedSize === size
                      ? "border-teal-600 bg-teal-50 font-semibold text-teal-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-teal-300"
                  }`}
                >
                  {translateSize(size)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Color options */}
        {colors.length > 0 && (
          <div className="mt-3 min-w-0">
            <p className="mb-1.5 text-xs font-medium text-gray-500">
              {t("cart.color")}
            </p>

            <div className="flex flex-wrap gap-1.5">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  aria-pressed={selectedColor === color}
                  title={translateColor(color)}
                  className={`max-w-full truncate rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    selectedColor === color
                      ? "border-teal-600 bg-teal-50 font-semibold text-teal-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-teal-300"
                  }`}
                >
                  {translateColor(color)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Price and add-to-cart */}
        <div className="mt-auto flex min-w-0 items-center gap-2 border-t border-gray-100 pt-3">
          <div className="min-w-0 flex-1">
            <span className="block text-[10px] leading-none text-gray-400">
              {t("common.price")}
            </span>

            <span className="mt-1 block break-words text-sm font-bold text-gray-900 sm:text-base">
              {currencyFormatter.format(price)}
            </span>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={handleAddToCart}
            aria-label={`${t("customer.addToCart")} ${product.name}`}
            className="h-9 shrink-0 rounded-full bg-teal-600 px-3 text-xs font-semibold text-white hover:bg-teal-700 sm:px-4"
          >
            <ShoppingCart className="mr-1.5 h-4 w-4 shrink-0" />
            <span>{t("customer.addToCart")}</span>
          </Button>
        </div>
      </div>
    </article>
  );
}

export default memo(ProductCard);
