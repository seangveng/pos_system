"use client";

import { ChevronDown } from "lucide-react";
import { FAQItem } from "../_types/helps";

interface FAQItemProps {
  item: FAQItem;
  open: boolean;
  onToggle: () => void;
}

export function FAQItemRow({ item, open, onToggle }: FAQItemProps) {
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
      >
        <span className="text-sm font-medium text-gray-800">
          {item.question}
        </span>

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="px-4 pb-4">
          <p className="text-xs leading-6 text-gray-500">{item.answer}</p>

          <span className="mt-2 inline-block rounded-lg bg-teal-50 px-2 py-1 text-[10px] font-medium text-teal-700">
            {item.category}
          </span>
        </div>
      )}
    </div>
  );
}
