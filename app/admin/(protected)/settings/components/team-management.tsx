"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Users,
  ShieldCheck,
  UserRound,
  RefreshCw,
  Mail,
  Phone,
} from "lucide-react";

import { AddUserDialog } from "./add-user-dialog";
import { useTranslation } from "@/hooks/use-translation";

type TeamRole = "OWNER" | "ADMIN" | "STAFF";
type AccountStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

interface TeamUser {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  phone?: string;
  role: TeamRole;
  status: AccountStatus;
  createdAt?: string;
}

interface TeamManagementProps {
  currentRole: "OWNER" | "ADMIN";
}

export function TeamManagement({ currentRole }: TeamManagementProps) {
  const { t } = useTranslation();

  const [users, setUsers] = useState<TeamUser[]>([]);
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadUsers = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await fetch("/api/admin/users?limit=100&page=1", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to load team members.");
        }

        const teamUsers: TeamUser[] = (data.users ?? []).filter(
          (user: TeamUser) =>
            user.role === "OWNER" ||
            user.role === "ADMIN" ||
            user.role === "STAFF",
        );

        setUsers(teamUsers);
      } catch {
        setError(t("settings.team.errors.loadFailed"));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [t],
  );

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        (user.phone ?? "").toLowerCase().includes(query);

      const matchesRole = selectedRole === "ALL" || user.role === selectedRole;

      return matchesSearch && matchesRole;
    });
  }, [users, search, selectedRole]);

  const adminCount = users.filter((user) => user.role === "ADMIN").length;

  const staffCount = users.filter((user) => user.role === "STAFF").length;

  const activeCount = users.filter((user) => user.status === "ACTIVE").length;

  function handleCreated() {
    setSuccess(t("settings.team.success.created"));
    setError("");
    void loadUsers(true);
  }

  return (
    <section className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 dark:border-gray-800">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {t("settings.team.title")}
            </h2>

            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t("settings.team.subtitle")}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void loadUsers(true)}
              disabled={refreshing}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              {t("settings.team.refresh")}
            </button>

            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white transition hover:bg-teal-700"
            >
              <Plus className="h-4 w-4" />
              {t("settings.team.addMember")}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3 sm:p-5">
          <StatCard
            label={t("settings.team.stats.totalTeam")}
            value={users.length}
            icon={<Users className="h-5 w-5" />}
          />

          <StatCard
            label={t("settings.team.stats.administrators")}
            value={adminCount}
            icon={<ShieldCheck className="h-5 w-5" />}
          />

          <StatCard
            label={t("settings.team.stats.staffMembers")}
            value={staffCount}
            icon={<UserRound className="h-5 w-5" />}
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("settings.team.searchPlaceholder")}
              aria-label={t("settings.team.searchLabel")}
              className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-900 outline-none transition focus:border-teal-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            />
          </div>

          <select
            value={selectedRole}
            onChange={(event) => setSelectedRole(event.target.value)}
            aria-label={t("settings.team.filterByRole")}
            className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-teal-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300"
          >
            <option value="ALL">{t("settings.team.roles.all")}</option>

            {currentRole === "OWNER" && (
              <>
                <option value="OWNER">{t("settings.team.roles.owner")}</option>
                <option value="ADMIN">{t("settings.team.roles.admin")}</option>
              </>
            )}

            <option value="STAFF">{t("settings.team.roles.staff")}</option>
          </select>
        </div>

        {error && (
          <div className="mx-4 mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mx-4 mb-4 rounded-xl border border-teal-200 bg-teal-50 p-3 text-sm text-teal-700 dark:border-teal-900 dark:bg-teal-950/30 dark:text-teal-400">
            {success}
          </div>
        )}

        <div className="border-t border-gray-100 dark:border-gray-800">
          {loading ? (
            <div className="flex min-h-52 items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <RefreshCw className="h-4 w-4 animate-spin" />
                {t("settings.team.loading")}
              </div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center px-4 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-gray-800">
                <Users className="h-6 w-6" />
              </div>

              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {users.length === 0
                  ? t("settings.team.empty.noMembers")
                  : t("settings.team.empty.noMatchingAccounts")}
              </p>

              <p className="mt-1 max-w-sm text-xs text-gray-500 dark:text-gray-400">
                {users.length === 0
                  ? t("settings.team.empty.createFirstHint")
                  : t("settings.team.empty.changeFilterHint")}
              </p>

              {users.length === 0 && (
                <button
                  type="button"
                  onClick={() => setDialogOpen(true)}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
                >
                  <Plus className="h-4 w-4" />
                  {t("settings.team.addFirstMember")}
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(0,1.2fr)_110px_110px] gap-4 bg-gray-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500 sm:grid dark:bg-gray-950 dark:text-gray-400">
                <span>{t("settings.team.table.teamMember")}</span>
                <span>{t("settings.team.table.contact")}</span>
                <span>{t("settings.team.table.role")}</span>
                <span>{t("settings.team.table.status")}</span>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredUsers.map((user) => (
                  <TeamUserRow
                    key={user._id ?? user.id ?? user.email}
                    user={user}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t("settings.team.showing", {
              count: filteredUsers.length,
              total: users.length,
            })}
            {` · ${t("settings.team.activeCount", { count: activeCount })}`}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-teal-100 bg-teal-50/60 p-4 dark:border-teal-900 dark:bg-teal-950/20">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal-600 dark:text-teal-400" />

          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {t("settings.team.permissions.title")}
            </p>

            <p className="mt-1 text-xs leading-5 text-gray-600 dark:text-gray-400">
              {currentRole === "OWNER"
                ? t("settings.team.permissions.owner")
                : t("settings.team.permissions.admin")}
            </p>
          </div>
        </div>
      </div>

      <AddUserDialog
        open={dialogOpen}
        currentRole={currentRole}
        onClose={() => setDialogOpen(false)}
        onCreated={handleCreated}
      />
    </section>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
        {icon}
      </div>

      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="mt-0.5 text-xl font-bold text-gray-900 dark:text-white">
          {value}
        </p>
      </div>
    </div>
  );
}

function TeamUserRow({ user }: { user: TeamUser }) {
  const { t } = useTranslation();

  const isAdmin = user.role === "ADMIN";
  const isOwner = user.role === "OWNER";

  const roleLabel = {
    OWNER: t("settings.team.roles.owner"),
    ADMIN: t("settings.team.roles.admin"),
    STAFF: t("settings.team.roles.staff"),
  }[user.role];

  const statusLabel = {
    ACTIVE: t("settings.team.status.active"),
    INACTIVE: t("settings.team.status.inactive"),
    SUSPENDED: t("settings.team.status.suspended"),
  }[user.status];

  return (
    <div className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1.2fr)_110px_110px] sm:items-center sm:gap-4 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
            isAdmin
              ? "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
              : "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300"
          }`}
        >
          {user.name?.charAt(0).toUpperCase() || "U"}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
            {user.name}
          </p>

          <p className="truncate text-xs text-gray-500 dark:text-gray-400 sm:hidden">
            {user.email}
          </p>
        </div>
      </div>

      <div className="min-w-0 space-y-1 pl-[52px] sm:pl-0">
        <p className="flex min-w-0 items-center gap-2 truncate text-xs text-gray-600 dark:text-gray-300">
          <Mail className="h-3.5 w-3.5 shrink-0 text-gray-400" />
          <span className="truncate">{user.email}</span>
        </p>

        {user.phone && (
          <p className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Phone className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            {user.phone}
          </p>
        )}
      </div>

      <div className="pl-[52px] sm:pl-0">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            isOwner
              ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
              : isAdmin
                ? "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
                : "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300"
          }`}
        >
          {roleLabel}
        </span>
      </div>

      <div className="pl-[52px] sm:pl-0">
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium ${
            user.status === "ACTIVE"
              ? "text-green-600 dark:text-green-400"
              : user.status === "SUSPENDED"
                ? "text-red-600 dark:text-red-400"
                : "text-gray-500 dark:text-gray-400"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              user.status === "ACTIVE"
                ? "bg-green-500"
                : user.status === "SUSPENDED"
                  ? "bg-red-500"
                  : "bg-gray-400"
            }`}
          />
          {statusLabel}
        </span>
      </div>
    </div>
  );
}
