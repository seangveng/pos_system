"use client";

import { Mail, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ContactSupport() {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
        <MessageCircle className="h-5 w-5" />
      </div>

      <h2 className="mt-4 text-sm font-bold text-gray-900">Need more help?</h2>

      <p className="mt-1 text-xs leading-5 text-gray-500">
        If you cannot find the answer you need, contact our support team.
      </p>

      <Button
        type="button"
        className="mt-4 h-9 w-full rounded-xl bg-teal-600 text-xs hover:bg-teal-700"
      >
        <Mail className="mr-2 h-4 w-4" />
        Contact Support
      </Button>
    </section>
  );
}
