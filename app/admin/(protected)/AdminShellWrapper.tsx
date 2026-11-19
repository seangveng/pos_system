"use client";

import type { ReactNode } from "react";

import AdminShell from "./orders/_component/admin-shell";

export default function AdminShellWrapper({
  children,
}: {
  children: ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
