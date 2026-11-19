"use client";

import type { Promo } from "../types/promos";

import { PromoCard } from "./promo-card";

interface PromosGridProps {
  promos: Promo[];
  onEdit: (promo: Promo) => void;
  onDelete: (promo: Promo) => void;
  onToggle: (promo: Promo) => void;
}

export function PromosGrid({
  promos,
  onEdit,
  onDelete,
  onToggle,
}: PromosGridProps) {
  // ======================================================
  // EMPTY STATE
  // ======================================================

  if (promos.length === 0) {
    return (
      <div className="flex min-h-[250px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <span className="text-2xl">%</span>
        </div>

        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          No promotions found
        </h3>

        <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
          Create your first promotion code to start offering discounts to your
          customers.
        </p>
      </div>
    );
  }

  // ======================================================
  // PROMOTIONS GRID
  // ======================================================

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {promos.map((promo) => {
        // Support both normalized frontend IDs and raw MongoDB IDs.
        const promoId = String(
          (promo as Promo & { _id?: string })._id ?? promo.id ?? "",
        ).trim();

        // Never render a card without a stable unique ID.
        if (!promoId) {
          return null;
        }

        // Keep the ID consistent throughout the frontend.
        const normalizedPromo: Promo = {
          ...promo,
          id: promoId,
        };

        return (
          <PromoCard
            key={promoId}
            promo={normalizedPromo}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggle={onToggle}
          />
        );
      })}
    </div>
  );
}
