"use client";

import Link from "next/link";

import {
  ArrowRight,
  MessageSquare,
  Package,
  Settings,
  Users,
} from "lucide-react";

import { QUICK_LINKS } from "../_action/helps";

const iconMap = {
  Package,
  Users,
  Settings,
  MessageSquare,
};

export function QuickLinks() {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-4 py-4">
        <h2 className="text-sm font-bold text-gray-900">Quick Links</h2>

        <p className="mt-1 text-xs text-gray-500">
          Quickly access important areas.
        </p>
      </div>

      <div className="p-2">
        {QUICK_LINKS.map((link) => {
          const Icon = iconMap[link.icon as keyof typeof iconMap] ?? Package;

          return (
            <Link
              key={link.id}
              href={link.href}
              className="group flex items-center gap-3 rounded-xl p-3 transition hover:bg-teal-50"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-500 group-hover:bg-white group-hover:text-teal-600">
                <Icon className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-gray-800">
                  {link.title}
                </p>

                <p className="mt-0.5 truncate text-[11px] text-gray-500">
                  {link.description}
                </p>
              </div>

              <ArrowRight className="h-4 w-4 shrink-0 text-gray-300 group-hover:text-teal-600" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
