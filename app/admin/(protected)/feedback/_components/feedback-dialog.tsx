"use client";

import { useEffect, useState } from "react";

import { Mail, MessageSquare, Save, User } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FeedbackItem,
  FeedbackRating,
  FeedbackStatus,
} from "../_types/feedback";

interface FeedbackDialogProps {
  open: boolean;
  feedback: FeedbackItem | null;
  onOpenChange: (open: boolean) => void;
  onSave: (feedback: FeedbackItem) => void;
}

const emptyFeedback: FeedbackItem = {
  id: "",
  customerName: "",
  email: "",
  rating: 5,
  message: "",
  status: "Unread",
  reply: "",
  createdAt: "",
};

export function FeedbackDialog({
  open,
  feedback,
  onOpenChange,
  onSave,
}: FeedbackDialogProps) {
  const [form, setForm] = useState<FeedbackItem>(emptyFeedback);

  useEffect(() => {
    if (feedback) {
      setForm(feedback);
    } else {
      setForm({
        ...emptyFeedback,
        createdAt: new Date().toISOString(),
      });
    }
  }, [feedback, open]);

  const updateField = <K extends keyof FeedbackItem>(
    field: K,
    value: FeedbackItem[K],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = () => {
    if (!form.customerName.trim()) return;
    if (!form.email.trim()) return;
    if (!form.message.trim()) return;

    onSave({
      ...form,
      customerName: form.customerName.trim(),
      email: form.email.trim(),
      message: form.message.trim(),
      reply: form.reply.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-24px)] max-w-lg rounded-2xl p-0">
        <DialogHeader className="border-b border-gray-100 px-5 py-4">
          <DialogTitle>
            {feedback ? "Edit Feedback" : "Add Feedback"}
          </DialogTitle>

          <DialogDescription>
            Add or update customer feedback.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">
              Customer Name
            </label>

            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <input
                value={form.customerName}
                onChange={(event) =>
                  updateField("customerName", event.target.value)
                }
                placeholder="Customer name"
                className="h-10 w-full rounded-xl border border-gray-200 pl-9 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">
              Email
            </label>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="customer@example.com"
                className="h-10 w-full rounded-xl border border-gray-200 pl-9 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">
              Rating
            </label>

            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() =>
                    updateField("rating", rating as FeedbackRating)
                  }
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg transition ${
                    rating <= form.rating
                      ? "bg-yellow-50 text-yellow-400"
                      : "bg-gray-50 text-gray-300"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">
              Status
            </label>

            <select
              value={form.status}
              onChange={(event) =>
                updateField("status", event.target.value as FeedbackStatus)
              }
              className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            >
              <option value="Unread">Unread</option>

              <option value="Read">Read</option>

              <option value="Replied">Replied</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">
              Feedback
            </label>

            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-gray-400" />

              <textarea
                value={form.message}
                onChange={(event) => updateField("message", event.target.value)}
                placeholder="Customer feedback..."
                rows={4}
                className="w-full resize-none rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">
              Reply
            </label>

            <textarea
              value={form.reply}
              onChange={(event) => updateField("reply", event.target.value)}
              placeholder="Optional reply..."
              rows={3}
              className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>
        </div>

        <DialogFooter className="border-t border-gray-100 px-5 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleSubmit}
            className="rounded-xl bg-teal-600 hover:bg-teal-700"
          >
            <Save className="mr-2 h-4 w-4" />

            {feedback ? "Save Changes" : "Add Feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
