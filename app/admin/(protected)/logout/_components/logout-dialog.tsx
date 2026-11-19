"use client";

import { AlertTriangle, Loader2, LogOut } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";

interface LogoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export function LogoutDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
  error = null,
}: LogoutDialogProps) {
  const { t } = useTranslation();

  const handleOpenChange = (nextOpen: boolean) => {
    if (isLoading) return;
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="w-[calc(100%-24px)] max-w-md rounded-2xl p-5 sm:p-6"
        onEscapeKeyDown={(event) => {
          if (isLoading) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (isLoading) event.preventDefault();
        }}
      >
        <DialogHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
          </div>

          <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">
            {t("logout.dialog.title")}
          </DialogTitle>

          <DialogDescription className="text-sm leading-6 text-gray-500 dark:text-gray-400">
            {t("logout.dialog.description")}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
          >
            {error}
          </div>
        )}

        <DialogFooter className="mt-4 flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={() => onOpenChange(false)}
            className="h-10 w-full rounded-xl sm:w-auto"
          >
            {t("logout.dialog.cancel")}
          </Button>

          <Button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className="h-10 w-full rounded-xl bg-red-600 text-white hover:bg-red-700 sm:w-auto"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="mr-2 h-4 w-4" />
            )}

            {t("logout.dialog.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
