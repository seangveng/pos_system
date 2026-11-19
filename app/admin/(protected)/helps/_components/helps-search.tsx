"use client";

import { Search } from "lucide-react";

interface HelpsSearchProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export function HelpsSearch({ search, onSearchChange }: HelpsSearchProps) {
  return (
    <div className="mb-6 rounded-2xl bg-teal-600 p-5 sm:p-7">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-lg font-bold text-white sm:text-xl">
          How can we help?
        </h2>

        <p className="mt-1 text-xs text-teal-50 sm:text-sm">
          Search for answers, guides and useful information.
        </p>

        <div className="relative mt-4">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

          <input
            type="text"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search for help..."
            className="h-12 w-full rounded-xl border-0 bg-white pl-12 pr-4 text-sm text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-white/50"
          />
        </div>
      </div>
    </div>
  );
}
