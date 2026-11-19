import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import connectDB from "@/lib/mongodb";
import User from "@/models/User";

import { ADMIN_SESSION_COOKIE, getAdminSession } from "@/lib/admin-auth";

import AdminShellWrapper from "./AdminShellWrapper";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED_ROLES = ["OWNER", "ADMIN", "STAFF"] as const;

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ======================================================
  // 1. VERIFY SESSION COOKIE
  // ======================================================

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  const admin = getAdminSession(token);

  if (
    !admin ||
    !ALLOWED_ROLES.includes(admin.role as (typeof ALLOWED_ROLES)[number])
  ) {
    redirect("/admin/login");
  }

  // ======================================================
  // 2. CONNECT TO MONGODB
  // ======================================================

  try {
    await connectDB();
  } catch (error) {
    redirect("/admin/login?error=database");
  }

  // ======================================================
  // 3. VERIFY USER AGAINST MONGODB
  // ======================================================

  const email = admin.email.trim().toLowerCase();

  const user = await User.findOne({
    email,
    role: admin.role,
    status: "ACTIVE",
  })
    .select("_id email role status")
    .lean();

  if (!user) {
    redirect("/admin/login");
  }

  // ======================================================
  // 4. RENDER PROTECTED DASHBOARD
  // ======================================================

  return <AdminShellWrapper>{children}</AdminShellWrapper>;
}
