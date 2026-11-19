"use client";

import { useState } from "react";
import { Loader2, Trash2, AlertTriangle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../../components/ui/dialog";

import { Button } from "../../../../../components/ui/button";

import type { Category } from "../types/categories";
import { deleteCategory } from "../../actions/categories";

interface DeleteCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  productCount: number;
  onDeleted: () => void | Promise<void>;
}

export function DeleteCategoryDialog({
  open,
  onOpenChange,
  category,
  productCount,
  onDeleted,
}: DeleteCategoryDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (!category) return;

    setLoading(true);
    setError("");

    try {
      await deleteCategory(category.id);
      await onDeleted();
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete category",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <Trash2 className="h-6 w-6 text-red-600" />
          </div>

          <DialogTitle>Delete Category</DialogTitle>

          <DialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-semibold text-gray-900">
              {category?.name}
            </span>
            ? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {productCount > 0 && (
          <div className="my-3 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />

            <div className="text-sm text-amber-800">
              <p className="font-semibold">
                This category contains {productCount}{" "}
                {productCount === 1 ? "product" : "products"}.
              </p>
              <p className="mt-1">
                Deleting this category will not delete those products. Their
                category name will remain unchanged.
              </p>
            </div>
          </div>
        )}

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleDelete}
            disabled={loading || !category}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Category
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
