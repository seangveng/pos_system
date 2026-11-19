import type { LogoutUser } from "../_types/logout";

/**
 * Get the currently authenticated user from the backend.
 * The server session is the only source of authentication identity.
 */
export async function getLogoutUser(): Promise<LogoutUser> {
  const response = await fetch("/api/admin/me", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || data?.success !== true) {
    throw new Error(data?.message || "Your session is invalid or has expired.");
  }

  const currentUser = data.user;

  if (
    !currentUser ||
    typeof currentUser.name !== "string" ||
    typeof currentUser.email !== "string" ||
    typeof currentUser.role !== "string" ||
    !currentUser.name.trim() ||
    !currentUser.email.trim()
  ) {
    throw new Error("Unable to retrieve your authenticated account.");
  }

  const role = currentUser.role.toUpperCase();

  if (!["OWNER", "ADMIN", "STAFF"].includes(role)) {
    throw new Error(
      "Your account does not have permission to access this page.",
    );
  }

  return {
    name: currentUser.name.trim(),
    email: currentUser.email.trim(),
    role,
  };
}

/**
 * End the authenticated server session.
 */
export async function logoutUser(): Promise<void> {
  const response = await fetch("/api/admin/logout", {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || data?.success !== true) {
    throw new Error(data?.message || "Unable to log out. Please try again.");
  }

  if (typeof window !== "undefined") {
    // Remove legacy client-side data only.
    localStorage.removeItem("pos-user");
    localStorage.removeItem("pos-authenticated");

    window.dispatchEvent(new Event("pos-logout"));

    window.location.replace("/admin/login");
  }
}
