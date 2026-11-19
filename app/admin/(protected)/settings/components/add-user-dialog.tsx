"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, X } from "lucide-react";

type UserRole = "OWNER" | "ADMIN" | "STAFF";

interface AddUserDialogProps {
  open: boolean;
  currentRole: "OWNER" | "ADMIN";
  onClose: () => void;
  onCreated: () => void;
}

export function AddUserDialog({
  open,
  currentRole,
  onClose,
  onCreated,
}: AddUserDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("STAFF");

  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setRole("STAFF");
      setShowPassword(false);
      setError("");
    }
  }, [open]);

  if (!open) return null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!name.trim() || !email.trim() || !password) {
      setError("Please complete all required fields.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (currentRole === "ADMIN" && role !== "STAFF") {
      setError("ADMIN can only create STAFF accounts.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/admin/users", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          password,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to create account.");
      }

      onCreated();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while creating the account.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-user-title"
        className="my-auto w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-gray-800">
          <div>
            <h2
              id="add-user-title"
              className="text-lg font-semibold text-gray-900 dark:text-white"
            >
              Add Team Member
            </h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Create a new staff or administrator account.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close dialog"
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 dark:hover:bg-gray-800 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400"
            >
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="team-name"
              className="text-xs font-medium text-gray-700 dark:text-gray-300"
            >
              Full Name *
            </label>
            <input
              id="team-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter full name"
              maxLength={100}
              required
              autoFocus
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="team-email"
              className="text-xs font-medium text-gray-700 dark:text-gray-300"
            >
              Email Address *
            </label>
            <input
              id="team-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              maxLength={254}
              required
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="team-phone"
              className="text-xs font-medium text-gray-700 dark:text-gray-300"
            >
              Phone Number
            </label>
            <input
              id="team-phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Enter phone number"
              maxLength={30}
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="team-password"
              className="text-xs font-medium text-gray-700 dark:text-gray-300"
            >
              Password *
            </label>

            <div className="relative">
              <input
                id="team-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                minLength={8}
                maxLength={72}
                required
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 pr-11 text-sm text-gray-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              />

              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="team-role"
              className="text-xs font-medium text-gray-700 dark:text-gray-300"
            >
              Account Role *
            </label>
            <select
              id="team-role"
              value={role}
              onChange={(event) => setRole(event.target.value as UserRole)}
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            >
              <option value="STAFF">Staff</option>

              {currentRole === "OWNER" && (
                <>
                  <option value="ADMIN">Admin</option>
                  <option value="OWNER">Owner</option>
                </>
              )}
            </select>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              {currentRole === "OWNER"
                ? "OWNER can create OWNER, ADMIN, and STAFF accounts."
                : "ADMIN can create STAFF accounts only."}
            </p>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-10 rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="h-10 rounded-xl bg-teal-600 px-5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Creating..." : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
