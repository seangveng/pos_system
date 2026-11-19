"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../../components/ui/dialog";

import { Input } from "../../../../../components/ui/input";
import { Button } from "../../../../../components/ui/button";
import { Label } from "../../../../../components/ui/label";
import { Textarea } from "../../../../../components/ui/textarea";

import type { Category } from "../types/categories";
import {
  addCategory,
  updateCategory,
  categoryNameExists,
} from "../../actions/categories";

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  onSaved: () => void | Promise<void>;
}

const COLORS = [
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#f97316",
  "#ec4899",
  "#eab308",
  "#22c55e",
  "#ef4444",
];

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  onSaved,
}: CategoryDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#14b8a6");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEditing = Boolean(category);

  useEffect(() => {
    if (!open) return;

    setName(category?.name || "");
    setDescription(category?.description || "");
    setColor(category?.color || "#14b8a6");
    setError("");
  }, [open, category]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Category name is required");
      return;
    }

    if (trimmedName.length > 50) {
      setError("Category name must be 50 characters or less");
      return;
    }

    if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
      setError("Please choose a valid color");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const exists = await categoryNameExists(trimmedName, category?.id);

      if (exists) {
        setError("This category name already exists");
        return;
      }

      const data = {
        name: trimmedName,
        description: description.trim(),
        color,
      };

      if (category) {
        await updateCategory(category.id, data);
      } else {
        await addCategory(data);
      }

      await onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save category");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Category" : "Add Category"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update your category information."
                : "Create a category to organize your products."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-5">
            <div className="space-y-2">
              <Label htmlFor="category-name">Category Name</Label>
              <Input
                id="category-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Clothing"
                maxLength={50}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-description">Description</Label>
              <Textarea
                id="category-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe this category..."
                rows={3}
                disabled={loading}
              />
            </div>

            <div className="space-y-3">
              <Label>Category Color</Label>

              <div className="flex flex-wrap items-center gap-3">
                {COLORS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    aria-label={`Select ${item}`}
                    onClick={() => setColor(item)}
                    disabled={loading}
                    className={`h-9 w-9 rounded-full border-2 transition ${
                      color === item
                        ? "scale-110 border-gray-900 ring-2 ring-gray-300"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: item }}
                  />
                ))}

                <Input
                  type="color"
                  value={color}
                  onChange={(event) => setColor(event.target.value)}
                  className="h-9 w-12 cursor-pointer p-1"
                  disabled={loading}
                />

                <span className="text-sm text-gray-500">{color}</span>
              </div>
            </div>

            {error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}
          </div>

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
              type="submit"
              disabled={loading}
              className="bg-teal-600 text-white hover:bg-teal-700"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
