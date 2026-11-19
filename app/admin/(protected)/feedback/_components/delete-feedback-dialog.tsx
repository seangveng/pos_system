"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FeedbackItem } from "../_types/feedback";

interface DeleteFeedbackDialogProps {
  open: boolean;
  feedback: FeedbackItem | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteFeedbackDialog({
  open,
  feedback,
  onOpenChange,
  onConfirm,
}: DeleteFeedbackDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-24px)] max-w-md rounded-2xl">
        <DialogHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <Trash2 className="h-5 w-5" />
          </div>

          <DialogTitle>Delete Feedback</DialogTitle>

          <DialogDescription>
            Are you sure you want to delete the feedback from{" "}
            <span className="font-semibold text-gray-900">
              {feedback?.customerName}
            </span>
            ? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4">
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
            onClick={onConfirm}
            className="rounded-xl bg-red-600 hover:bg-red-700"
          >
            Delete Feedback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
