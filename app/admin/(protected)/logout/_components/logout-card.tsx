"use client";

import { LogOut, Mail, ShieldCheck, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";

import { useTranslation } from "@/hooks/use-translation";
import type { LogoutUser } from "../_types/logout";

interface LogoutCardProps {
  user: LogoutUser;
  onLogout: () => void;
}

export function LogoutCard({ user, onLogout }: LogoutCardProps) {
  const { t } = useTranslation();

  return (
    <div>
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <FieldGroup>
          {/* Header */}
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
              <LogOut className="h-6 w-6" />
            </div>

            <h2 className="text-2xl font-bold tracking-tight">
              {t("logout.title")}
            </h2>

            <FieldDescription className="max-w-sm text-balance">
              {t("logout.description")}
            </FieldDescription>
          </div>

          <FieldSeparator />

          {/* User Information */}
          <Field>
            <FieldLabel>{t("logout.accountLabel")}</FieldLabel>

            <div className="rounded-lg border border-border bg-muted/40 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background text-primary">
                  <User className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{user.name}</p>

                  <div className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <p className="truncate text-xs">{user.email}</p>
                  </div>
                </div>

                <span className="shrink-0 rounded-md bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
                  {t(`roles.${String(user.role).toLowerCase()}`)}
                </span>
              </div>
            </div>
          </Field>

          {/* Security Information */}
          <Field>
            <div className="flex items-start gap-3 rounded-lg border border-teal-200 bg-teal-50/70 p-3 dark:border-teal-900 dark:bg-teal-950/30">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal-600 dark:text-teal-400" />

              <div className="min-w-0">
                <p className="text-sm font-semibold text-teal-800 dark:text-teal-300">
                  {t("logout.securityTitle")}
                </p>

                <FieldDescription className="mt-1 text-xs text-teal-700 dark:text-teal-400">
                  {t("logout.securityDescription")}
                </FieldDescription>
              </div>
            </div>
          </Field>

          {/* Logout Action */}
          <Field>
            <Button
              type="button"
              onClick={onLogout}
              variant="destructive"
              className="w-full"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t("logout.button")}
            </Button>

            <FieldDescription className="text-center">
              {t("logout.footer")}
            </FieldDescription>
          </Field>
        </FieldGroup>
      </div>
    </div>
  );
}
