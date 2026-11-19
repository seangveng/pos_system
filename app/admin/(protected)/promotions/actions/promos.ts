import type { CreatePromoInput, Promo, UpdatePromoInput } from "@/types/promos";

const PROMOS_API = "/api/promos";

// ======================================================
// API RESPONSE TYPES
// ======================================================

type PromoResponse = {
  success?: boolean;
  promo?: unknown;
  promos?: unknown[];
  message?: string;
  error?: string;
};

// ======================================================
// NORMALIZE MONGODB PROMOTION
// ======================================================

/**
 * MongoDB returns _id.
 * The frontend uses id.
 *
 * Convert MongoDB documents into the Promo interface.
 */
function normalizePromo(value: unknown): Promo {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid promotion data received.");
  }

  const promo = value as Record<string, unknown>;

  const id = String(promo.id ?? promo._id ?? "");

  if (!id) {
    throw new Error("Promotion ID is missing.");
  }

  function normalizeDate(value: unknown): string | null {
    if (value === null || value === undefined || value === "") {
      return null;
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (typeof value === "string") {
      return value;
    }

    return null;
  }

  return {
    ...promo,
    id,
    code: String(promo.code ?? ""),
    description: String(promo.description ?? ""),
    discountType: promo.discountType as "percentage" | "fixed",
    discountValue: Number(promo.discountValue ?? 0),
    minimumOrder: Number(promo.minimumOrder ?? 0),
    usageLimit:
      promo.usageLimit === null || promo.usageLimit === undefined
        ? null
        : Number(promo.usageLimit),
    usedCount: Number(promo.usedCount ?? 0),
    startDate: normalizeDate(promo.startDate),
    endDate: normalizeDate(promo.endDate),
    isActive: Boolean(promo.isActive),
    createdAt: normalizeDate(promo.createdAt) ?? undefined,
    updatedAt: normalizeDate(promo.updatedAt) ?? undefined,
  } as Promo;
}

// ======================================================
// API REQUEST HELPER
// ======================================================

async function apiRequest<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = (await response.json().catch(() => ({}))) as T & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error || "Something went wrong. Please try again.");
  }

  return data;
}

// ======================================================
// GET: LOAD ALL PROMOTIONS
// ======================================================

export async function getPromos(): Promise<Promo[]> {
  const data = await apiRequest<PromoResponse>(PROMOS_API, {
    method: "GET",
  });

  if (!Array.isArray(data.promos)) {
    return [];
  }

  return data.promos.map(normalizePromo);
}

// ======================================================
// GET: LOAD ONE PROMOTION
// ======================================================

export async function getPromo(id: string): Promise<Promo> {
  const data = await apiRequest<PromoResponse>(
    `${PROMOS_API}/${encodeURIComponent(id)}`,
    {
      method: "GET",
    },
  );

  if (!data.promo) {
    throw new Error("Promotion not found.");
  }

  return normalizePromo(data.promo);
}

// ======================================================
// POST: CREATE PROMOTION
// ======================================================

export async function addPromo(data: CreatePromoInput): Promise<Promo> {
  const response = await apiRequest<PromoResponse>(PROMOS_API, {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.promo) {
    throw new Error("Unable to create promotion.");
  }

  return normalizePromo(response.promo);
}

// ======================================================
// PATCH: UPDATE PROMOTION
// ======================================================

export async function updatePromo(
  id: string,
  data: UpdatePromoInput,
): Promise<Promo> {
  // The ID is already provided in the URL.
  // Do not send it as part of the update payload.
  const { id: _id, ...updateData } = data;

  const response = await apiRequest<PromoResponse>(
    `${PROMOS_API}/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify(updateData),
    },
  );

  if (!response.promo) {
    throw new Error("Unable to update promotion.");
  }

  return normalizePromo(response.promo);
}

// ======================================================
// DELETE: DELETE PROMOTION
// ======================================================

export async function deletePromo(id: string): Promise<void> {
  await apiRequest<PromoResponse>(`${PROMOS_API}/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

// ======================================================
// PATCH: TOGGLE PROMOTION ACTIVE STATUS
// ======================================================

export async function togglePromo(promo: Promo): Promise<Promo> {
  return updatePromo(promo.id, {
    id: promo.id,
    code: promo.code,
    description: promo.description,
    discountType: promo.discountType,
    discountValue: promo.discountValue,
    minimumOrder: promo.minimumOrder,
    usageLimit: promo.usageLimit ?? null,
    startDate: promo.startDate || "",
    endDate: promo.endDate || "",
    isActive: !promo.isActive,
  });
}

// ======================================================
// CHECK WHETHER A PROMO CODE EXISTS
// ======================================================

export async function promoCodeExists(
  code: string,
  excludeId?: string,
): Promise<boolean> {
  const normalizedCode = code.trim().toUpperCase();

  if (!normalizedCode) {
    return false;
  }

  const promos = await getPromos();

  return promos.some(
    (promo) =>
      promo.id !== excludeId &&
      promo.code.trim().toUpperCase() === normalizedCode,
  );
}
