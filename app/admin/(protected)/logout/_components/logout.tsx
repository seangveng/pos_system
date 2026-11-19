"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { getLogoutUser, logoutUser } from "../_action/logout";

import type { LogoutUser } from "../_types/logout";

import { LogoutHeader } from "./logout-header";
import { LogoutCard } from "./logout-card";
import { LogoutDialog } from "./logout-dialog";

export default function Logout() {
  const [user, setUser] = useState<LogoutUser | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userError, setUserError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        setIsLoadingUser(true);
        setUserError(null);

        const currentUser = await getLogoutUser();

        if (active) {
          setUser(currentUser);
        }
      } catch (err) {
        if (active) {
          setUserError(
            err instanceof Error
              ? err.message
              : "Unable to retrieve your account.",
          );
        }
      } finally {
        if (active) {
          setIsLoadingUser(false);
        }
      }
    }

    loadUser();

    return () => {
      active = false;
    };
  }, []);

  const handleOpenLogoutDialog = useCallback(() => {
    setError(null);
    setDialogOpen(true);
  }, []);

  const handleConfirmLogout = useCallback(async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      setError(null);

      await logoutUser();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to log out. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  return (
    <div className="flex min-h-full w-full flex-1 items-center justify-center overflow-x-hidden overflow-y-auto p-4 sm:p-6">
      <div className="flex w-full max-w-xl flex-col items-center">
        <div className="w-full">
          <LogoutHeader />
        </div>

        <div className="w-full">
          {isLoadingUser ? (
            <div className="flex min-h-64 items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
          ) : userError ? (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
            >
              {userError}
            </div>
          ) : user ? (
            <LogoutCard user={user} onLogout={handleOpenLogoutDialog} />
          ) : null}
        </div>
      </div>

      <LogoutDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={handleConfirmLogout}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
}
