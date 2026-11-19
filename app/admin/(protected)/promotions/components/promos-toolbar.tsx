"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";

import { Input } from "../../../../../components/ui/input";
import { Button } from "../../../../../components/ui/button";
import { useTranslation } from "@/hooks/use-translation";

interface PromosToolbarProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
}

export function PromosToolbar({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
}: PromosToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-3 sm:flex-row">
      {/* Search */}
      <div className="relative min-w-0 flex-1">
        <label htmlFor="promo-search" className="sr-only">
          {t("promotions.toolbar.searchLabel")}
        </label>

        <Search
          aria-hidden="true"
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
        />

        <Input
          id="promo-search"
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={t("promotions.toolbar.searchPlaceholder")}
          className="h-9 rounded-xl border-gray-200 pl-9 pr-9 text-sm focus-visible:border-teal-500 focus-visible:ring-teal-500/20"
        />

        {searchQuery && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setSearchQuery("")}
            aria-label={t("promotions.toolbar.clearSearch")}
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Status Filter */}
      <div className="relative sm:w-40">
        <label htmlFor="promo-status-filter" className="sr-only">
          {t("promotions.toolbar.statusFilterLabel")}
        </label>

        <SlidersHorizontal
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-gray-400"
        />

        <select
          id="promo-status-filter"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="h-9 w-full appearance-none rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        >
          <option value="all">{t("promotions.toolbar.allStatus")}</option>
          <option value="active">{t("promotions.toolbar.active")}</option>
          <option value="inactive">{t("promotions.toolbar.inactive")}</option>
        </select>
      </div>
    </div>
  );
}
