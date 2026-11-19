"use client";

import { useState } from "react";

import { AlertTriangle, Loader2 } from "lucide-react";

import { Button } from "../../../../../components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../../components/ui/dialog";

import type { Promo } from "@/types/promos";
import { deletePromo } from "../actions/promos";

interface DeletePromoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promo: Promo | null;
  onDeleted: () => void | Promise<void>;
}

export function DeletePromoDialog({
  open,
  onOpenChange,
  promo,
  onDeleted,
}: DeletePromoDialogProps) {
  // ======================================================
  // STATE
  // ======================================================

  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  // ======================================================
  // CLOSE DIALOG
  // ======================================================

  const handleClose = () => {
    if (isDeleting) return;

    setError("");
    onOpenChange(false);
  };

  // ======================================================
  // DELETE PROMOTION
  // ======================================================

  const handleDelete = async () => {
    if (isDeleting || !promo) return;

    if (!promo.id) {
      setError("Unable to delete promotion: missing promotion ID.");
      return;
    }

    try {
      setIsDeleting(true);
      setError("");

      // Delete promotion from MongoDB.
      await deletePromo(promo.id);

      // Close dialog only after successful deletion.
      onOpenChange(false);

      // Refresh promotion list.
      await onDeleted();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete promo code. Please try again.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // ======================================================
  // RENDER
  // ======================================================

  if (!promo) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          handleClose();
        } else {
          onOpenChange(true);
        }
      }}
    >
      <DialogContent className="w-[calc(100%-24px)] rounded-2xl sm:max-w-md">
        {/* Header */}
        <DialogHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>

          <DialogTitle>Delete Promo Code?</DialogTitle>

          <DialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-semibold text-gray-900">{promo.code}</span>?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {/* Promotion Information */}
        <div className="rounded-xl bg-gray-50 p-3">
          <p className="text-xs text-gray-500">Promo code</p>

          <p className="mt-1 font-bold text-gray-900">{promo.code}</p>

          <p className="mt-2 text-xs text-gray-500">
            Used {promo.usedCount ?? 0} time(s)
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600"
          >
            {error}
          </div>
        )}

        {/* Footer */}
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
            className="rounded-xl"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={() => void handleDelete()}
            disabled={isDeleting}
            className="rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Promo"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
