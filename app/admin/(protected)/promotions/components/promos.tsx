"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { Promo } from "../types/promos";

import { getPromos, togglePromo } from "../actions/promos";

import { PromosHeader } from "./promos-header";
import { PromosStats } from "./promos-stats";
import { PromosToolbar } from "./promos-toolbar";
import { PromosGrid } from "./promos-grid";
import { PromoDialog } from "./promo-dialog";
import { DeletePromoDialog } from "./delete-promo-dialog";

export function Promos() {
  // ======================================================
  // STATE
  // ======================================================

  const [promos, setPromos] = useState<Promo[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [isPromoDialogOpen, setIsPromoDialogOpen] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<Promo | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [promoToDelete, setPromoToDelete] = useState<Promo | null>(null);

  // Prevent stale requests from updating state.
  const requestIdRef = useRef(0);

  // Prevent state updates after unmount.
  const isMountedRef = useRef(false);

  // ======================================================
  // LOAD PROMOTIONS FROM MONGODB
  // ======================================================

  const loadPromos = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    try {
      setError(null);

      const data = await getPromos();

      // Ignore outdated or unmounted requests.
      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        return;
      }

      setPromos(data);
    } catch (err) {
      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load promotions. Please try again.",
      );
    } finally {
      if (isMountedRef.current && requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // ======================================================
  // INITIAL LOAD
  // ======================================================

  useEffect(() => {
    isMountedRef.current = true;

    void loadPromos();

    return () => {
      isMountedRef.current = false;

      // Invalidate any request still running.
      requestIdRef.current += 1;
    };
  }, [loadPromos]);

  // ======================================================
  // FILTER PROMOTIONS
  // ======================================================

  const filteredPromos = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return promos.filter((promo) => {
      const promoCode = (promo.code ?? "").toLowerCase();

      const promoDescription = (promo.description ?? "").toLowerCase();

      const matchesSearch =
        !query || promoCode.includes(query) || promoDescription.includes(query);

      // This filter represents the manual active switch.
      // Scheduled, expired, and usage-limit statuses
      // are handled separately by the promo card.
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && promo.isActive) ||
        (statusFilter === "inactive" && !promo.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [promos, searchQuery, statusFilter]);

  // ======================================================
  // PROMOTION STATISTICS
  // ======================================================

  const totalPromos = promos.length;

  const activePromos = promos.filter((promo) => promo.isActive).length;

  const inactivePromos = totalPromos - activePromos;

  const totalUsed = promos.reduce(
    (total, promo) => total + (Number(promo.usedCount) || 0),
    0,
  );

  // ======================================================
  // CREATE PROMOTION
  // ======================================================

  const handleAddPromo = () => {
    setSelectedPromo(null);
    setIsPromoDialogOpen(true);
  };

  // ======================================================
  // EDIT PROMOTION
  // ======================================================

  const handleEditPromo = (promo: Promo) => {
    setSelectedPromo(promo);
    setIsPromoDialogOpen(true);
  };

  // ======================================================
  // PROMOTION SAVED
  // ======================================================

  const handlePromoSaved = async () => {
    setIsPromoDialogOpen(false);
    setSelectedPromo(null);

    await loadPromos();
  };

  // ======================================================
  // DELETE PROMOTION
  // ======================================================

  const handleDeletePromo = (promo: Promo) => {
    setPromoToDelete(promo);
    setIsDeleteDialogOpen(true);
  };

  // ======================================================
  // PROMOTION DELETED
  // ======================================================

  const handlePromoDeleted = async () => {
    setIsDeleteDialogOpen(false);
    setPromoToDelete(null);

    await loadPromos();
  };

  // ======================================================
  // TOGGLE PROMOTION STATUS
  // ======================================================

  const handleTogglePromo = async (promo: Promo) => {
    // Prevent simultaneous toggle requests.
    if (isToggling !== null) return;

    if (!promo.id) {
      setError("Unable to update promotion: missing promo ID.");
      return;
    }

    try {
      setError(null);
      setIsToggling(promo.id);

      await togglePromo(promo);

      // Refresh data from MongoDB after successful update.
      await loadPromos();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update promotion status. Please try again.",
      );
    } finally {
      if (isMountedRef.current) {
        setIsToggling(null);
      }
    }
  };

  // ======================================================
  // RETRY LOADING
  // ======================================================

  const handleRetry = () => {
    setIsLoading(true);

    void loadPromos();
  };

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <PromosHeader onAddPromo={handleAddPromo} />

      {/* Statistics */}
      <PromosStats
        totalPromos={totalPromos}
        activePromos={activePromos}
        inactivePromos={inactivePromos}
        totalUsed={totalUsed}
      />

      {/* Toolbar */}
      <PromosToolbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {/* Error Message */}
      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm text-red-500">{error}</p>

          <button
            type="button"
            onClick={handleRetry}
            disabled={isLoading}
            className="w-fit rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-500 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Loading..." : "Try again"}
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex min-h-[250px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />

          <p className="text-sm text-muted-foreground">Loading promotions...</p>
        </div>
      ) : (
        <>
          {/* Promotions Grid */}
          <PromosGrid
            promos={filteredPromos}
            onEdit={handleEditPromo}
            onDelete={handleDeletePromo}
            onToggle={handleTogglePromo}
          />

          {/* Empty Search Result */}
          {filteredPromos.length === 0 && !error && (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                {promos.length === 0
                  ? "No promotions yet. Create your first promotion."
                  : "No promotions match your search or filter."}
              </p>
            </div>
          )}
        </>
      )}

      {/* Create / Edit Promotion Dialog */}
      <PromoDialog
        open={isPromoDialogOpen}
        onOpenChange={setIsPromoDialogOpen}
        promo={selectedPromo}
        onSaved={handlePromoSaved}
      />

      {/* Delete Promotion Dialog */}
      <DeletePromoDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        promo={promoToDelete}
        onDeleted={handlePromoDeleted}
      />
    </div>
  );
}
