"use client";

import { Plus, Tag } from "lucide-react";

import { Button } from "../../../../../components/ui/button";
import { useTranslation } from "@/hooks/use-translation";

interface PromosHeaderProps {
  onAddPromo: () => void;
}

export function PromosHeader({ onAddPromo }: PromosHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Page Title */}
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
          <Tag aria-hidden="true" className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-gray-900 sm:text-2xl">
            {t("promotions.header.title")}
          </h1>

          <p className="truncate text-xs text-gray-500 sm:text-sm">
            {t("promotions.header.subtitle")}
          </p>
        </div>
      </div>

      {/* Add Promotion Button */}
      <Button
        type="button"
        onClick={onAddPromo}
        className="w-full rounded-xl bg-teal-600 text-white hover:bg-teal-700 sm:w-auto"
      >
        <Plus aria-hidden="true" className="mr-2 h-4 w-4" />
        {t("promotions.header.addPromo")}
      </Button>
    </div>
  );
}
