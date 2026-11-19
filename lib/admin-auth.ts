import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

export type UserRole = "CUSTOMER" | "STAFF" | "ADMIN" | "OWNER";

export interface AdminSession {
  email: string;
  role: UserRole;
  expiresAt: number;
}

const SESSION_DURATION_SECONDS = 60 * 60 * 8;

export const ADMIN_SESSION_COOKIE = "admin_session";
export const ADMIN_SESSION_MAX_AGE = SESSION_DURATION_SECONDS;

const VALID_ROLES: UserRole[] = ["CUSTOMER", "STAFF", "ADMIN", "OWNER"];

const ADMIN_ROLES: UserRole[] = ["OWNER", "ADMIN", "STAFF"];

// ======================================================
// SECRET
// ======================================================

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "ADMIN_SESSION_SECRET must be configured with a strong secret.",
    );
  }

  return secret;
}

// ======================================================
// SIGNATURE
// ======================================================

function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

// ======================================================
// CREATE ADMIN SESSION
// ======================================================

export function createAdminSession(
  email: string,
  role: UserRole = "OWNER",
): string {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error("A valid email is required to create an admin session.");
  }

  if (!VALID_ROLES.includes(role)) {
    throw new Error("Invalid user role.");
  }

  const payload = Buffer.from(
    JSON.stringify({
      email: normalizedEmail,
      role,
      expiresAt: Date.now() + SESSION_DURATION_SECONDS * 1000,
    }),
  ).toString("base64url");

  return `${payload}.${sign(payload)}`;
}

// ======================================================
// VERIFY ADMIN SESSION
// ======================================================

export function getAdminSession(token?: string): AdminSession | null {
  if (!token) {
    return null;
  }

  try {
    const parts = token.split(".");

    if (parts.length !== 2) {
      return null;
    }

    const [payload, signature] = parts;

    if (!payload || !signature) {
      return null;
    }

    const expectedSignature = sign(payload);

    const receivedBuffer = Buffer.from(signature, "base64url");
    const expectedBuffer = Buffer.from(expectedSignature, "base64url");

    if (
      receivedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(receivedBuffer, expectedBuffer)
    ) {
      return null;
    }

    const decodedPayload = Buffer.from(payload, "base64url").toString("utf8");

    const session: unknown = JSON.parse(decodedPayload);

    if (!session || typeof session !== "object") {
      return null;
    }

    const data = session as Record<string, unknown>;

    if (
      typeof data.email !== "string" ||
      !data.email.trim() ||
      typeof data.role !== "string" ||
      !VALID_ROLES.includes(data.role as UserRole) ||
      typeof data.expiresAt !== "number" ||
      !Number.isFinite(data.expiresAt) ||
      data.expiresAt <= Date.now()
    ) {
      return null;
    }

    return {
      email: data.email.trim().toLowerCase(),
      role: data.role as UserRole,
      expiresAt: data.expiresAt,
    };
  } catch {
    return null;
  }
}

// ======================================================
// BACKWARD-COMPATIBLE BOOLEAN VERIFICATION
// ======================================================

export function verifyAdminSession(token?: string): boolean {
  const session = getAdminSession(token);

  if (!session) {
    return false;
  }

  return ADMIN_ROLES.includes(session.role);
}

// ======================================================
// ROLE CHECK
// ======================================================

export function hasRole(
  session: AdminSession | null,
  allowedRoles: UserRole[],
): boolean {
  if (!session) {
    return false;
  }

  return allowedRoles.includes(session.role);
}
