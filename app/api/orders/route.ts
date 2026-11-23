import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, unstable_cache } from "next/cache";
import mongoose from "mongoose";

import connectDB from "@/lib/mongodb";
import OnlineOrder from "@/models/OnlineOrder";
import Product from "@/models/Product";
import Counter from "@/models/Counter";
import Promo from "@/models/Promo";
import User from "@/models/User";

import {
  ADMIN_SESSION_COOKIE,
  getAdminSession,
  type AdminSession,
} from "@/lib/admin-auth";

import type { PromoErrorCode, PromoErrorResponse } from "@/types/promo-errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAYMENT_METHODS = [
  "CASH",
  "ABA",
  "ACLEDA",
  "KHQR",
  "CARD",
  "PAYPAL",
  "STRIPE",
] as const;

const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
] as const;

const CAMBODIA_TIME_ZONE = "Asia/Phnom_Penh";

type RequestedItem = {
  id: number;
  quantity: number;
  size: string | null;
  color: string | null;
};

type PromoCalculation = {
  promoId: mongoose.Types.ObjectId | null;
  promoCode: string | null;
  discount: number;
};

// ======================================================
// AUTHENTICATION
// ======================================================

async function getAdmin(request: NextRequest): Promise<AdminSession | null> {
  try {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

    if (!token) {
      return null;
    }

    const admin = getAdminSession(token);

    if (!admin || !["OWNER", "ADMIN", "STAFF"].includes(admin.role)) {
      return null;
    }

    const email = admin.email.trim().toLowerCase();

    // 1. Check the environment-based OWNER account.
    const envOwnerEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

    if (admin.role === "OWNER" && envOwnerEmail && email === envOwnerEmail) {
      return admin;
    }

    // 2. Verify MongoDB accounts, including OWNER.
    await connectDB();

    const user = await User.findOne({ email })
      .select("email role status")
      .lean();

    if (!user || user.status !== "ACTIVE") {
      return null;
    }

    // 3. The database role must match the signed session role.
    if (user.role !== admin.role) {
      return null;
    }

    if (!["OWNER", "ADMIN", "STAFF"].includes(user.role)) {
      return null;
    }

    return admin;
  } catch (error) {
    console.error("Order API authentication error:", error);
    return null;
  }
}

// ======================================================
// ADMIN ORDER CACHE (30 SECONDS)
// ======================================================

const getCachedAdminOrders = unstable_cache(
  async (
    status: string,
    source: string,
    paymentStatus: string,
    search: string,
  ) => {
    await connectDB();

    const filter: Record<string, unknown> = {};

    if (status) {
      filter.status = status;
    }

    if (source) {
      filter.orderSource = source;
    }

    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
        { "customer.name": { $regex: search, $options: "i" } },
        { "customer.phone": { $regex: search, $options: "i" } },
      ];
    }

    const orders = await OnlineOrder.find(filter)
      .select("-items.image")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return JSON.parse(JSON.stringify(orders));
  },
  ["admin-orders-list-v2"],
  {
    revalidate: 30,
    tags: ["admin-online-orders"],
  },
);

// ======================================================
// CART ITEM VALIDATION
// ======================================================

/**
 * Parse and merge cart items.
 */
function parseItems(value: unknown): RequestedItem[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 50) {
    return null;
  }

  const merged = new Map<string, RequestedItem>();

  for (const raw of value) {
    if (!raw || typeof raw !== "object") {
      return null;
    }

    const item = raw as Record<string, unknown>;

    const id = Number(item.id ?? item.productId);
    const quantity = Number(item.quantity);

    if (
      !Number.isSafeInteger(id) ||
      id <= 0 ||
      !Number.isSafeInteger(quantity) ||
      quantity <= 0 ||
      quantity > 100
    ) {
      return null;
    }

    const size = item.size ? String(item.size).trim() : null;
    const color = item.color ? String(item.color).trim() : null;

    const key = `${id}|${size ?? ""}|${color ?? ""}`;
    const existing = merged.get(key);

    if (existing) {
      existing.quantity += quantity;

      if (existing.quantity > 100) {
        return null;
      }
    } else {
      merged.set(key, {
        id,
        quantity,
        size,
        color,
      });
    }
  }

  return [...merged.values()];
}

// ======================================================
// ORDER NUMBER GENERATION
// ======================================================

/**
 * Generate sequential order numbers.
 */
async function generateOrderNumber(
  session: mongoose.ClientSession,
): Promise<string> {
  const counter = await Counter.findByIdAndUpdate(
    "order",
    {
      $inc: {
        sequence: 1,
      },
    },
    {
      returnDocument: "after",
      upsert: true,
      setDefaultsOnInsert: true,
      session,
    },
  );

  if (!counter) {
    throw new Error("ORDER_NUMBER_FAILED");
  }

  return `ORD-${String(counter.sequence).padStart(6, "0")}`;
}

// ======================================================
// CAMBODIA PROMOTION DATE HANDLING
// ======================================================

/**
 * Validate YYYY-MM-DD without allowing JavaScript
 * to normalize invalid dates such as February 31.
 */
function isValidDateOnly(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * Convert a stored promotion date into its Cambodia calendar-day
 * boundary.
 *
 * Date-only values are interpreted directly as Cambodia dates.
 * ISO timestamps are converted to their Cambodia calendar date.
 *
 * Start: 00:00:00.000 UTC+7
 * End:   23:59:59.999 UTC+7
 */
function getPromoDateBoundary(
  value: Date | string | null | undefined,
  isEndDate = false,
): Date | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  let dateString: string;

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    if (!isValidDateOnly(value)) {
      return null;
    }

    dateString = value;
  } else {
    const date = value instanceof Date ? value : new Date(String(value));

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: CAMBODIA_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);

    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    const day = parts.find((part) => part.type === "day")?.value;

    if (!year || !month || !day) {
      return null;
    }

    dateString = `${year}-${month}-${day}`;
  }

  const time = isEndDate ? "23:59:59.999" : "00:00:00.000";

  return new Date(`${dateString}T${time}+07:00`);
}

// ======================================================
// PROMOTION CALCULATION
// ======================================================

/**
 * Calculate and reserve a promotion inside the order transaction.
 *
 * The browser never supplies the discount amount.
 * The server reads the promotion directly from MongoDB.
 */
async function calculatePromoDiscount(
  code: string,
  subtotal: number,
  session: mongoose.ClientSession,
): Promise<PromoCalculation> {
  if (!code) {
    return {
      promoId: null,
      promoCode: null,
      discount: 0,
    };
  }

  const promo = await Promo.findOne({
    code,
  }).session(session);

  if (!promo) {
    throw new Error("PROMO_INVALID");
  }

  if (!promo.isActive) {
    throw new Error("PROMO_INACTIVE");
  }

  const now = new Date();

  const startDate = getPromoDateBoundary(promo.startDate, false);
  const endDate = getPromoDateBoundary(promo.endDate, true);

  if ((promo.startDate && !startDate) || (promo.endDate && !endDate)) {
    throw new Error("PROMO_INVALID_DATE");
  }

  if (startDate && endDate && startDate > endDate) {
    throw new Error("PROMO_INVALID_DATE");
  }

  if (startDate && now < startDate) {
    throw new Error("PROMO_NOT_STARTED");
  }

  if (endDate && now > endDate) {
    throw new Error("PROMO_EXPIRED");
  }

  const minimumOrder = Number(promo.minimumOrder ?? 0);

  if (!Number.isFinite(minimumOrder) || minimumOrder < 0) {
    throw new Error("PROMO_INVALID");
  }

  if (subtotal < minimumOrder) {
    throw new Error("PROMO_MINIMUM_ORDER");
  }

  if (
    promo.usageLimit !== null &&
    promo.usageLimit !== undefined &&
    promo.usedCount >= promo.usageLimit
  ) {
    throw new Error("PROMO_LIMIT_REACHED");
  }

  const discountValue = Number(promo.discountValue);

  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    throw new Error("PROMO_INVALID");
  }

  if (promo.discountType !== "percentage" && promo.discountType !== "fixed") {
    throw new Error("PROMO_INVALID");
  }

  if (promo.discountType === "percentage" && discountValue > 100) {
    throw new Error("PROMO_INVALID");
  }

  const rawDiscount =
    promo.discountType === "percentage"
      ? (subtotal * discountValue) / 100
      : discountValue;

  const discount = Math.min(subtotal, Math.round(rawDiscount * 100) / 100);

  // Atomically reserve one promo use.
  const usageFilter: Record<string, unknown> = {
    _id: promo._id,
    isActive: true,
    usedCount: promo.usedCount,
  };

  if (promo.usageLimit !== null && promo.usageLimit !== undefined) {
    usageFilter.$expr = {
      $lt: ["$usedCount", promo.usageLimit],
    };
  }

  const usageResult = await Promo.updateOne(
    usageFilter,
    {
      $inc: {
        usedCount: 1,
      },
    },
    {
      session,
    },
  );

  if (usageResult.modifiedCount !== 1) {
    throw new Error("PROMO_LIMIT_REACHED");
  }

  return {
    promoId: promo._id as mongoose.Types.ObjectId,
    promoCode: promo.code,
    discount,
  };
}

// ======================================================
// PROMOTION ERROR RESPONSE
// ======================================================

function getPromoErrorResponse(code: PromoErrorCode) {
  const messages: Record<PromoErrorCode, string> = {
    PROMO_INVALID: "This promo code does not exist or is invalid.",

    PROMO_INVALID_DATE:
      "This promo code has an invalid validity date. Please contact the store.",

    PROMO_INACTIVE: "This promo code is currently inactive.",

    PROMO_NOT_STARTED: "This promo code is not available yet.",

    PROMO_EXPIRED: "This promo code has expired.",

    PROMO_MINIMUM_ORDER:
      "Your order does not meet the minimum amount for this promo.",

    PROMO_LIMIT_REACHED: "This promo code has reached its usage limit.",
  };

  const response: PromoErrorResponse = {
    success: false,
    error: messages[code],
    code,
  };

  return NextResponse.json(response, {
    status: code === "PROMO_LIMIT_REACHED" ? 409 : 400,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

// ======================================================
// GET: ADMIN ORDER LIST OR PUBLIC CUSTOMER ORDER LOOKUP
// ======================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const orderNumber = searchParams.get("order");
    const phone = searchParams.get("phone");

    // Public customer order lookup.
    if (orderNumber || phone) {
      if (
        !orderNumber ||
        !phone ||
        orderNumber.length > 100 ||
        phone.length > 30
      ) {
        return NextResponse.json(
          {
            error: "Order number and phone are required.",
          },
          {
            status: 400,
          },
        );
      }

      await connectDB();

      const order = await OnlineOrder.findOne({
        orderNumber: orderNumber.trim(),
        "customer.phone": phone.trim(),
      })
        .select(
          "orderNumber orderSource customer.name items subtotal discount promoCode tax deliveryFee total paymentMethod paymentStatus status createdAt updatedAt",
        )
        .lean();

      if (!order) {
        return NextResponse.json(
          {
            error: "Order not found. Please check your information.",
          },
          {
            status: 404,
          },
        );
      }

      return NextResponse.json(
        {
          order,
        },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
          },
        },
      );
    }

    // Protected staff order listing.
    const admin = await getAdmin(request);

    if (!admin) {
      return NextResponse.json(
        {
          error: "Unauthorized. Please sign in again.",
        },
        {
          status: 401,
        },
      );
    }

    const statusParam = searchParams.get("status") ?? "";
    const sourceParam = searchParams.get("source") ?? "";
    const paymentStatusParam = searchParams.get("paymentStatus") ?? "";
    const search = (searchParams.get("search") ?? "").trim();

    const status = ORDER_STATUSES.includes(
      statusParam as (typeof ORDER_STATUSES)[number],
    )
      ? statusParam
      : "";

    const source = ["ONLINE", "STAFF"].includes(sourceParam) ? sourceParam : "";

    const paymentStatus = ["UNPAID", "PAID", "FAILED", "REFUNDED"].includes(
      paymentStatusParam,
    )
      ? paymentStatusParam
      : "";

    const forceRefresh = searchParams.get("refresh") === "1";

    if (forceRefresh) {
      revalidateTag("admin-online-orders");
    }

    const orders = await getCachedAdminOrders(
      status,
      source,
      paymentStatus,
      search,
    );

    return NextResponse.json(
      {
        orders,
        user: {
          email: admin.email,
          role: admin.role,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    );
  } catch (error) {
    console.error("GET orders error:", error);

    return NextResponse.json(
      {
        error: "Unable to load orders.",
      },
      {
        status: 500,
      },
    );
  }
}

// ======================================================
// POST: CUSTOMER ONLINE CHECKOUT OR STAFF POS CHECKOUT
// ======================================================

export async function POST(request: NextRequest) {
  let session: mongoose.ClientSession | undefined;

  try {
    const body = await request.json();

    if (
      !body ||
      typeof body !== "object" ||
      !["ONLINE", "STAFF"].includes(body.orderSource)
    ) {
      return NextResponse.json(
        {
          error: "Invalid order source.",
        },
        {
          status: 400,
        },
      );
    }

    const isStaffOrder = body.orderSource === "STAFF";

    // Staff POS orders require authenticated staff.
    const admin = isStaffOrder ? await getAdmin(request) : null;

    if (isStaffOrder && !admin) {
      return NextResponse.json(
        {
          error: "Active staff login required.",
        },
        {
          status: 401,
        },
      );
    }

    const items = parseItems(body.items);

    if (!items) {
      return NextResponse.json(
        {
          error: "Invalid cart items.",
        },
        {
          status: 400,
        },
      );
    }

    const customerName =
      typeof body.customer?.name === "string"
        ? body.customer.name.trim().slice(0, 100)
        : "";

    const customerPhone =
      typeof body.customer?.phone === "string"
        ? body.customer.phone.trim().slice(0, 30)
        : "";

    const customerAddress =
      typeof body.customer?.address === "string"
        ? body.customer.address.trim().slice(0, 300)
        : "";

    const notes =
      typeof body.customer?.notes === "string"
        ? body.customer.notes.trim().slice(0, 500)
        : "";

    if (
      !isStaffOrder &&
      (!customerName || !customerPhone || !customerAddress)
    ) {
      return NextResponse.json(
        {
          error: "Name, phone and address are required.",
        },
        {
          status: 400,
        },
      );
    }

    const paymentMethod = body.paymentMethod ?? "CASH";

    if (
      typeof paymentMethod !== "string" ||
      !PAYMENT_METHODS.includes(
        paymentMethod as (typeof PAYMENT_METHODS)[number],
      )
    ) {
      return NextResponse.json(
        {
          error: "Invalid payment method.",
        },
        {
          status: 400,
        },
      );
    }

    const promoCode =
      typeof body.promoCode === "string"
        ? body.promoCode.trim().toUpperCase()
        : "";

    if (promoCode && !/^[A-Z0-9_-]{3,30}$/.test(promoCode)) {
      return NextResponse.json(
        {
          error: "Invalid promo code format.",
          code: "PROMO_INVALID",
        },
        {
          status: 400,
        },
      );
    }

    const requestedDeliveryFee = isStaffOrder
      ? 0
      : Number(body.deliveryFee ?? 0);

    if (
      !Number.isFinite(requestedDeliveryFee) ||
      requestedDeliveryFee < 0 ||
      requestedDeliveryFee > 100000
    ) {
      return NextResponse.json(
        {
          error: "Invalid delivery fee.",
        },
        {
          status: 400,
        },
      );
    }

    await connectDB();

    // Create one MongoDB session for this order transaction.
    // Keep a non-optional reference for all transaction operations.
    const transactionSession = await mongoose.startSession();

    session = transactionSession;

    let createdOrder:
      | {
          orderNumber: string;
          subtotal: number;
          discount: number;
          promoCode: string | null;
          tax: number;
          deliveryFee: number;
          total: number;
          status: string;
          paymentStatus: string;
        }
      | undefined;

    await transactionSession.withTransaction(async () => {
      const ids = [...new Set(items.map((item) => item.id))];

      const products = await Product.find({
        id: {
          $in: ids,
        },
        status: "active",
      }).session(transactionSession);

      if (products.length !== ids.length) {
        throw new Error("PRODUCT_UNAVAILABLE");
      }

      const productMap = new Map(
        products.map((product) => [product.id, product]),
      );

      const orderItems = items.map((item) => {
        const product = productMap.get(item.id);

        if (!product) {
          throw new Error("PRODUCT_UNAVAILABLE");
        }

        // Only validate stock for stock-tracked products.
        if (product.trackStock === true && product.stock < item.quantity) {
          throw new Error(`INSUFFICIENT_STOCK:${product.name}`);
        }

        if (
          (item.size && !product.sizes.includes(item.size)) ||
          (item.color && !product.colors.includes(item.color))
        ) {
          throw new Error(`INVALID_VARIANT:${product.name}`);
        }

        return {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          category: product.category,
          price: product.price,
          quantity: item.quantity,
          image: product.image ?? "",
          size: item.size,
          color: item.color,
        };
      });

      // Deduct stock only for products with tracking enabled.
      for (const item of orderItems) {
        const product = productMap.get(item.productId);

        if (!product || product.trackStock !== true) {
          continue;
        }

        const result = await Product.updateOne(
          {
            id: item.productId,
            status: "active",
            trackStock: true,
            stock: {
              $gte: item.quantity,
            },
          },
          {
            $inc: {
              stock: -item.quantity,
            },
          },
          {
            session: transactionSession,
          },
        );

        if (result.modifiedCount !== 1) {
          throw new Error(`INSUFFICIENT_STOCK:${item.name}`);
        }
      }

      // Calculate subtotal using database product prices.
      const subtotal =
        Math.round(
          orderItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0,
          ) * 100,
        ) / 100;

      // Validate promotion and calculate discount from MongoDB.
      const promo = await calculatePromoDiscount(
        promoCode,
        subtotal,
        transactionSession,
      );

      // Subtract discount from subtotal.
      const discountedSubtotal = Math.max(0, subtotal - promo.discount);

      // Tax has been removed from checkout.
      // Keep the database field for compatibility with existing orders.
      const tax = 0;

      const deliveryFee = requestedDeliveryFee;

      // Final amount = discounted subtotal + delivery fee.
      const total = Math.round((discountedSubtotal + deliveryFee) * 100) / 100;

      const orderNumber = await generateOrderNumber(transactionSession);

      const paymentStatus =
        isStaffOrder && paymentMethod === "CASH" ? "PAID" : "UNPAID";

      const status = isStaffOrder ? "CONFIRMED" : "PENDING";

      const [order] = await OnlineOrder.create(
        [
          {
            orderNumber,
            orderSource: isStaffOrder ? "STAFF" : "ONLINE",
            createdBy: admin?.email ?? null,

            customer: {
              name: customerName || "Walk-in Customer",
              phone: customerPhone || "N/A",
              address: customerAddress || "Store pickup",
              notes,
            },

            items: orderItems,

            subtotal,
            discount: promo.discount,
            promoCode: promo.promoCode,
            promoId: promo.promoId,

            tax,
            deliveryFee,
            total,

            paymentMethod,
            paymentStatus,
            paidAt: paymentStatus === "PAID" ? new Date() : null,
            status,
          },
        ],
        {
          session: transactionSession,
        },
      );

      createdOrder = {
        orderNumber: order.orderNumber,
        subtotal: order.subtotal,
        discount: order.discount,
        promoCode: order.promoCode ?? null,
        tax: order.tax,
        deliveryFee: order.deliveryFee,
        total: order.total,
        status: order.status,
        paymentStatus: order.paymentStatus,
      };
    });

    if (!createdOrder) {
      throw new Error("ORDER_CREATION_FAILED");
    }

    // A new order changes the admin order list. Invalidate every filter cache.
    revalidateTag("admin-online-orders");

    return NextResponse.json(
      {
        message: "Order created successfully.",
        order: createdOrder,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    const promoErrors: PromoErrorCode[] = [
      "PROMO_INVALID",
      "PROMO_INVALID_DATE",
      "PROMO_INACTIVE",
      "PROMO_NOT_STARTED",
      "PROMO_EXPIRED",
      "PROMO_MINIMUM_ORDER",
      "PROMO_LIMIT_REACHED",
    ];

    if (promoErrors.includes(message as PromoErrorCode)) {
      return getPromoErrorResponse(message as PromoErrorCode);
    }

    if (
      message === "PRODUCT_UNAVAILABLE" ||
      message.startsWith("INSUFFICIENT_STOCK:") ||
      message.startsWith("INVALID_VARIANT:")
    ) {
      return NextResponse.json(
        {
          error:
            message === "PRODUCT_UNAVAILABLE"
              ? "One or more products are unavailable."
              : message.startsWith("INSUFFICIENT_STOCK:")
                ? `Not enough stock for ${message.split(":")[1]}.`
                : `Invalid product option for ${message.split(":")[1]}.`,
        },
        {
          status: 409,
        },
      );
    }

    console.error("POST orders error:", error);

    return NextResponse.json(
      {
        error: "Unable to create order. Please try again.",
      },
      {
        status: 500,
      },
    );
  } finally {
    // Close the same session used by the transaction.
    await session?.endSession();
  }
}
