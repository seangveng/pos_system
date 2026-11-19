"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import type { Category } from "../../categories/types/categories";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCategories } from "../../actions/categories";

interface ProductCategorySelectProps {
  value: string;
  onChange: (value: string) => void;
}

export function ProductCategorySelect({
  value,
  onChange,
}: ProductCategorySelectProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadCategories() {
      try {
        setLoading(true);
        setError("");

        const data = await getCategories();

        if (active) {
          setCategories(data);
        }
      } catch (err) {
        if (active) {
          setError("Unable to load categories");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadCategories();

    return () => {
      active = false;
    };
  }, []);

  return (
    <Select
      value={value}
      onValueChange={onChange}
      disabled={loading || categories.length === 0}
    >
      <SelectTrigger>
        {loading ? (
          <span className="flex items-center gap-2 text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading categories...
          </span>
        ) : (
          <SelectValue
            placeholder={
              error ||
              (categories.length === 0
                ? "No categories available"
                : "Select category")
            }
          />
        )}
      </SelectTrigger>

      <SelectContent>
        {categories.map((category) => (
          <SelectItem key={category.id} value={category.name}>
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              {category.name}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
