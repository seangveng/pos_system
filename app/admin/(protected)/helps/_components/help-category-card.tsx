"use client";

import {
  CreditCard,
  Package,
  Rocket,
  Settings,
  ShoppingCart,
  Users,
} from "lucide-react";
import { HelpCategory } from "../_types/helps";

interface HelpCategoryCardProps {
  category: HelpCategory;
  onClick: (category: HelpCategory) => void;
}

const iconMap = {
  Rocket,
  ShoppingCart,
  Package,
  CreditCard,
  Settings,
  Users,
};

export function HelpCategoryCard({ category, onClick }: HelpCategoryCardProps) {
  const Icon =
    iconMap[category.icon as keyof typeof iconMap] ?? HelpCategoryCard;

  return (
    <button
      type="button"
      onClick={() => onClick(category)}
      className="group rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-sm sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 transition group-hover:bg-teal-600 group-hover:text-white">
          <Icon className="h-5 w-5" />
        </div>

        <span className="rounded-lg bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-500">
          {category.articles} articles
        </span>
      </div>

      <h3 className="mt-4 text-sm font-semibold text-gray-900">
        {category.title}
      </h3>

      <p className="mt-1 text-xs leading-5 text-gray-500">
        {category.description}
      </p>
    </button>
  );
}
