import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import OnlineOrder from "@/models/OnlineOrder";
import User from "@/models/User";

import {
  ADMIN_SESSION_COOKIE,
  getAdminSession,
  type AdminSession,
} from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AdminRole = "OWNER" | "ADMIN" | "STAFF";

type TransactionStatus =
  | "PAID"
  | "PENDING"
  | "FAILED"
  | "REFUNDED"
  | "CANCELLED";

/* =========================================================
   ADMIN AUTHENTICATION
========================================================= */

async function getAdmin(request: NextRequest): Promise<AdminSession | null> {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

  if (!token) return null;

  try {
    const session = getAdminSession(token);

    if (!session) return null;

    const email = session.email?.trim().toLowerCase();
    const role = session.role as AdminRole;

    if (!email) return null;

    if (!["OWNER", "ADMIN", "STAFF"].includes(role)) {
      return null;
    }

    // OWNER: trust the verified signed session.
    if (role === "OWNER") {
      return session;
    }

    // ADMIN / STAFF: verify active account in MongoDB.
    await connectDB();

    const user = await User.findOne({
      email,
      role,
      status: "ACTIVE",
    })
      .select("_id")
      .lean();

    if (!user) return null;

    return session;
  } catch (error) {
    console.error("Transactions authentication error:", error);
    return null;
  }
}

/* =========================================================
   TRANSACTION STATUS
========================================================= */

function getTransactionStatus(order: {
  paymentStatus: string;
  status: string;
}): TransactionStatus {
  const paymentStatus = order.paymentStatus?.toUpperCase();
  const orderStatus = order.status?.toUpperCase();

  if (paymentStatus === "REFUNDED") {
    return "REFUNDED";
  }

  if (orderStatus === "CANCELLED") {
    return "CANCELLED";
  }

  if (paymentStatus === "FAILED") {
    return "FAILED";
  }

  if (paymentStatus === "PAID") {
    return "PAID";
  }

  return "PENDING";
}

/* =========================================================
   HELPERS
========================================================= */

function normalizeString(value: unknown): string {
  return String(value ?? "").trim();
}

function safeNumber(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Keep normal image URLs, but exclude large Base64 images.
 */
function safeImage(value: unknown): string {
  const image = normalizeString(value);

  if (!image) return "";

  if (image.startsWith("data:")) return "";

  if (image.length > 2048) return "";

  return image;
}

/* =========================================================
   GET TRANSACTIONS FROM MONGODB
   No unstable_cache.
========================================================= */

async function getTransactions(
  search: string,
  source: string,
  paymentMethod: string,
  status: string,
  limit: number,
) {
  await connectDB();

  const filter: Record<string, unknown> = {};

  // Order source filter.
  if (source && source !== "ALL") {
    filter.orderSource = source;
  }

  // Payment method filter.
  if (paymentMethod && paymentMethod !== "ALL") {
    filter.paymentMethod = paymentMethod;
  }

  // Transaction status filter.
  if (status && status !== "ALL") {
    switch (status) {
      case "PAID":
        filter.paymentStatus = "PAID";
        filter.status = { $ne: "CANCELLED" };
        break;

      case "PENDING":
        filter.paymentStatus = "UNPAID";
        filter.status = { $ne: "CANCELLED" };
        break;

      case "FAILED":
        filter.paymentStatus = "FAILED";
        filter.status = { $ne: "CANCELLED" };
        break;

      case "REFUNDED":
        filter.paymentStatus = "REFUNDED";
        break;

      case "CANCELLED":
        filter.status = "CANCELLED";
        break;
    }
  }

  // Search filter.
  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");

    filter.$or = [
      { orderNumber: regex },
      { "customer.name": regex },
      { "customer.phone": regex },
      { "customer.address": regex },
      { paymentMethod: regex },
      { createdBy: regex },
      { promoCode: regex },
    ];
  }

  // Fetch orders.
  const orders = await OnlineOrder.find(filter)
    .select(
      [
        "orderNumber",
        "orderSource",
        "createdBy",
        "customer",
        "items",
        "subtotal",
        "discount",
        "promoCode",
        "tax",
        "deliveryFee",
        "total",
        "paymentMethod",
        "paymentStatus",
        "paidAt",
        "status",
        "createdAt",
      ].join(" "),
    )
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  // Convert orders into transactions.
  const transactions = orders.map((order) => {
    const transactionStatus = getTransactionStatus({
      paymentStatus: order.paymentStatus,
      status: order.status,
    });

    const total = safeNumber(order.total);

    const items = (order.items || []).map((item) => ({
      productId: item.productId,
      name: item.name,
      sku: item.sku || "",
      category: item.category || "Other",
      price: safeNumber(item.price),
      quantity: safeNumber(item.quantity),
      image: safeImage(item.image),
      size: item.size,
      color: item.color,
    }));

    return {
      id: order.orderNumber,

      storeId:
        order.orderSource === "STAFF" ? "Happy Birds POS" : "Online Store",

      orderSource: order.orderSource,

      paymentStatus: order.paymentStatus,
      orderStatus: order.status,
      status: transactionStatus,

      // Customer.
      customerName: order.customer?.name || "Walk-in Customer",
      customerPhone: order.customer?.phone || "",
      customerAddress: order.customer?.address || "",
      customerNotes: order.customer?.notes || "",

      // Amount.
      amount: total,
      total,
      currency: "USD",

      // Payment.
      gateway: order.paymentMethod,
      paymentMethod: order.paymentMethod,

      // Financial breakdown.
      subtotal: safeNumber(order.subtotal),
      discount: safeNumber(order.discount),
      promoCode: order.promoCode || "",
      tax: safeNumber(order.tax),
      deliveryFee: safeNumber(order.deliveryFee),

      // Staff.
      createdBy: order.createdBy,

      // Dates.
      createdAt: order.createdAt,
      paidAt: order.paidAt,

      // Items.
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      items,
    };
  });

  // Summary for returned transactions.
  const summary = {
    totalTransactions: transactions.length,

    paid: transactions.filter((transaction) => transaction.status === "PAID")
      .length,

    pending: transactions.filter(
      (transaction) => transaction.status === "PENDING",
    ).length,

    failed: transactions.filter(
      (transaction) => transaction.status === "FAILED",
    ).length,

    refunded: transactions.filter(
      (transaction) => transaction.status === "REFUNDED",
    ).length,

    cancelled: transactions.filter(
      (transaction) => transaction.status === "CANCELLED",
    ).length,

    totalAmount: transactions
      .filter((transaction) => transaction.status === "PAID")
      .reduce((sum, transaction) => sum + transaction.amount, 0),

    pendingAmount: transactions
      .filter((transaction) => transaction.status === "PENDING")
      .reduce((sum, transaction) => sum + transaction.amount, 0),

    refundedAmount: transactions
      .filter((transaction) => transaction.status === "REFUNDED")
      .reduce((sum, transaction) => sum + transaction.amount, 0),
  };

  return {
    transactions,
    summary,
  };
}

/* =========================================================
   GET TRANSACTIONS API
========================================================= */

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication.
    const admin = await getAdmin(request);

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Please login again.",
        },
        {
          status: 401,
          headers: {
            "Cache-Control": "no-store, max-age=0",
          },
        },
      );
    }

    // 2. Query parameters.
    const { searchParams } = new URL(request.url);

    /* =====================================================
       LIGHTWEIGHT SIDEBAR TRANSACTION COUNT

       GET /api/transactions?countOnly=true

       Returns only the total number of orders.
       Does not retrieve transaction documents or items.
    ===================================================== */

    if (searchParams.get("countOnly") === "true") {
      await connectDB();

      const count = await OnlineOrder.countDocuments({});

      return NextResponse.json(
        {
          success: true,
          count,
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "private, no-store, max-age=0",
          },
        },
      );
    }

    // 3. Normal transaction query parameters.
    const search = normalizeString(searchParams.get("search"));

    const source = normalizeString(searchParams.get("source")).toUpperCase();

    const paymentMethod = normalizeString(
      searchParams.get("paymentMethod"),
    ).toUpperCase();

    const status = normalizeString(searchParams.get("status")).toUpperCase();

    const requestedLimit = Number(searchParams.get("limit") || 100);

    const limit = Math.min(
      Math.max(
        Number.isFinite(requestedLimit) ? Math.floor(requestedLimit) : 100,
        1,
      ),
      1000,
    );

    // 4. Query MongoDB directly.
    const result = await getTransactions(
      search,
      source,
      paymentMethod,
      status,
      limit,
    );

    // 5. Return response without Next.js data caching.
    return NextResponse.json(
      {
        success: true,
        transactions: result.transactions,
        summary: result.summary,
        meta: {
          total: result.transactions.length,
          limit,
          search,
          source: source || "ALL",
          paymentMethod: paymentMethod || "ALL",
          status: status || "ALL",
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    console.error("GET /api/transactions error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load transactions.",
        error:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  }
}
