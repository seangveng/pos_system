"use client";

import { useState } from "react";

import { HelpCircle } from "lucide-react";

import { FAQItemRow } from "./faq-item";
import { FAQItem } from "../_types/helps";

interface FAQListProps {
  items: FAQItem[];
}

export function FAQList({ items }: FAQListProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white">
      <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
          <HelpCircle className="h-4 w-4" />
        </div>

        <div>
          <h2 className="text-sm font-bold text-gray-900">
            Frequently Asked Questions
          </h2>

          <p className="text-xs text-gray-500">
            Quick answers to common questions.
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="px-4 py-10 text-center">
          <p className="text-sm font-medium text-gray-700">
            No questions found
          </p>

          <p className="mt-1 text-xs text-gray-500">Try another search.</p>
        </div>
      ) : (
        <div>
          {items.map((item) => (
            <FAQItemRow
              key={item.id}
              item={item}
              open={openId === item.id}
              onToggle={() => setOpenId(openId === item.id ? null : item.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
