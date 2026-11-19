import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import OnlineOrder from "@/models/OnlineOrder";
import User from "@/models/User";

import { ADMIN_SESSION_COOKIE, getAdminSession } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Role = "STAFF" | "ADMIN" | "OWNER";

const DB_QUERY_TIMEOUT = 15000;
const CAMBODIA_TIMEZONE = "Asia/Phnom_Penh";

const NO_CACHE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
};

/* =========================================================
   DATABASE ERROR DETECTION
========================================================= */

function isDatabaseUnavailable(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const message = `${error.name} ${error.message}`;

  return /MongoNetwork|MongoServerSelection|MongoNetworkTimeout|PoolClearedOnNetwork|MongooseServerSelection|MongoTimeout|ECONNRESET|ECONNREFUSED|ETIMEDOUT/i.test(
    message,
  );
}

/* =========================================================
   RESPONSE HELPERS
========================================================= */

function errorResponse(message: string, status: number, error?: unknown) {
  return NextResponse.json(
    {
      success: false,
      message,
      details:
        process.env.NODE_ENV === "development" && error instanceof Error
          ? error.message
          : undefined,
    },
    {
      status,
      headers: NO_CACHE_HEADERS,
    },
  );
}

/* =========================================================
   ADMIN AUTHENTICATION
   OWNER / ADMIN / STAFF: MONGODB ONLY
========================================================= */

async function getCurrentRole(request: NextRequest): Promise<Role | null> {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const session = await getAdminSession(token);

  if (!session?.email || !session?.role) {
    return null;
  }

  const allowedRoles: Role[] = ["OWNER", "ADMIN", "STAFF"];

  if (!allowedRoles.includes(session.role as Role)) {
    return null;
  }

  const email = session.email.trim().toLowerCase();
  const role = session.role as Role;

  // All roles must have an active MongoDB account.
  const user = await User.findOne({
    email,
    role,
    status: "ACTIVE",
  })
    .select("email role status")
    .maxTimeMS(DB_QUERY_TIMEOUT)
    .lean()
    .exec();

  if (!user) {
    return null;
  }

  return user.role as Role;
}

/* =========================================================
   CAMBODIA DATE VALIDATION
========================================================= */

function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);

  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function parseReportDate(value: string, endOfDay = false): Date | null {
  // Date-only values are interpreted in Cambodia time.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    if (!isValidDateOnly(value)) {
      return null;
    }

    const time = endOfDay ? "23:59:59.999" : "00:00:00.000";

    const date = new Date(`${value}T${time}+07:00`);

    return Number.isNaN(date.getTime()) ? null : date;
  }

  // Full ISO timestamps are accepted as supplied.
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

/* =========================================================
   GET ADMIN REPORTS
========================================================= */

export async function GET(request: NextRequest) {
  try {
    // 1. DATABASE CONNECTION
    await connectDB();

    // 2. AUTHENTICATION
    const role = await getCurrentRole(request);

    if (!role) {
      return errorResponse("Unauthorized. Please login again.", 401);
    }

    const { searchParams } = new URL(request.url);

    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // 3. PAGINATION
    const page = Math.max(
      1,
      Number.parseInt(searchParams.get("page") || "1", 10) || 1,
    );

    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(searchParams.get("limit") || "20", 10) || 20),
    );

    // 4. CAMBODIA DATE FILTERING
    const dateFilter: Record<string, Date> = {};

    if (from) {
      const fromDate = parseReportDate(from);

      if (!fromDate) {
        return errorResponse("Invalid from date.", 400);
      }

      dateFilter.$gte = fromDate;
    }

    if (to) {
      const toDate = parseReportDate(to, true);

      if (!toDate) {
        return errorResponse("Invalid to date.", 400);
      }

      dateFilter.$lte = toDate;
    }

    if (
      dateFilter.$gte &&
      dateFilter.$lte &&
      dateFilter.$gte > dateFilter.$lte
    ) {
      return errorResponse("From date must be before to date.", 400);
    }

    const filter: Record<string, unknown> = {};

    if (Object.keys(dateFilter).length > 0) {
      filter.createdAt = dateFilter;
    }

    const paidFilter = {
      ...filter,
      paymentStatus: "PAID",
    };

    // 5. REPORT QUERIES
    const [
      totalOrders,
      paidOrders,
      revenueResult,
      orderStatusSummary,
      paymentStatusSummary,
      paymentSummary,
      productsSoldResult,
      dailyRevenue,
      orders,
    ] = await Promise.all([
      // Total orders
      OnlineOrder.countDocuments(filter).maxTimeMS(DB_QUERY_TIMEOUT).exec(),

      // Paid orders
      OnlineOrder.countDocuments(paidFilter).maxTimeMS(DB_QUERY_TIMEOUT).exec(),

      // Total paid revenue
      OnlineOrder.aggregate([
        { $match: paidFilter },
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: {
                $round: [{ $multiply: ["$total", 100] }, 0],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            totalRevenue: {
              $divide: ["$totalRevenue", 100],
            },
          },
        },
      ])
        .option({ maxTimeMS: DB_QUERY_TIMEOUT })
        .exec(),

      // Order status summary
      OnlineOrder.aggregate([
        { $match: filter },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
        .option({ maxTimeMS: DB_QUERY_TIMEOUT })
        .exec(),

      // Payment status summary
      OnlineOrder.aggregate([
        { $match: filter },
        {
          $group: {
            _id: "$paymentStatus",
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
        .option({ maxTimeMS: DB_QUERY_TIMEOUT })
        .exec(),

      // Staff cannot access payment breakdown.
      role === "STAFF"
        ? Promise.resolve([])
        : OnlineOrder.aggregate([
            { $match: paidFilter },
            {
              $group: {
                _id: "$paymentMethod",
                count: { $sum: 1 },
                amount: {
                  $sum: {
                    $round: [{ $multiply: ["$total", 100] }, 0],
                  },
                },
              },
            },
            {
              $project: {
                _id: 1,
                count: 1,
                amount: {
                  $divide: ["$amount", 100],
                },
              },
            },
            { $sort: { _id: 1 } },
          ])
            .option({ maxTimeMS: DB_QUERY_TIMEOUT })
            .exec(),

      // Products sold
      OnlineOrder.aggregate([
        { $match: paidFilter },
        { $unwind: "$items" },
        {
          $group: {
            _id: null,
            productsSold: {
              $sum: "$items.quantity",
            },
          },
        },
        {
          $project: {
            _id: 0,
            productsSold: 1,
          },
        },
      ])
        .option({ maxTimeMS: DB_QUERY_TIMEOUT })
        .exec(),

      // Daily revenue grouped by Cambodia calendar day.
      OnlineOrder.aggregate([
        { $match: paidFilter },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
                timezone: CAMBODIA_TIMEZONE,
              },
            },
            revenue: {
              $sum: {
                $round: [{ $multiply: ["$total", 100] }, 0],
              },
            },
            transactions: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            date: "$_id",
            revenue: {
              $divide: ["$revenue", 100],
            },
            transactions: 1,
          },
        },
        { $sort: { date: 1 } },
      ])
        .option({ maxTimeMS: DB_QUERY_TIMEOUT })
        .exec(),

      // Latest orders with pagination.
      OnlineOrder.find(filter)
        .select(
          "orderNumber customer items subtotal discount promoCode tax deliveryFee total status paymentStatus paymentMethod orderSource paidAt createdAt",
        )
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .maxTimeMS(DB_QUERY_TIMEOUT)
        .lean()
        .exec(),
    ]);

    const totalRevenue = revenueResult[0]?.totalRevenue ?? 0;

    const unpaidOrders =
      paymentStatusSummary.find((item) => item._id === "UNPAID")?.count ?? 0;

    const failedOrders =
      paymentStatusSummary.find((item) => item._id === "FAILED")?.count ?? 0;

    const refundedOrders =
      paymentStatusSummary.find((item) => item._id === "REFUNDED")?.count ?? 0;

    const productsSold = productsSoldResult[0]?.productsSold ?? 0;

    const averagePaidOrderValue =
      paidOrders > 0 ? Math.round((totalRevenue / paidOrders) * 100) / 100 : 0;

    // 7. RESPONSE
    return NextResponse.json(
      {
        success: true,

        summary: {
          totalOrders,
          paidOrders,
          unpaidOrders,
          failedOrders,
          refundedOrders,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          averagePaidOrderValue,
          productsSold,
        },

        statusSummary: orderStatusSummary.map((item) => ({
          status: item._id,
          count: item.count,
        })),

        paymentStatusSummary: paymentStatusSummary.map((item) => ({
          status: item._id,
          count: item.count,
        })),

        dailyRevenue,

        paymentSummary:
          role === "STAFF"
            ? null
            : paymentSummary.map((item) => ({
                paymentMethod: item._id,
                count: item.count,
                amount: item.amount,
              })),

        orders,

        pagination: {
          page,
          limit,
          total: totalOrders,
          totalPages: Math.ceil(totalOrders / limit),
        },
      },
      {
        headers: NO_CACHE_HEADERS,
      },
    );
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return errorResponse(
        "Database is temporarily unavailable. Please try again.",
        503,
        error,
      );
    }

    return errorResponse("Unable to generate reports.", 500, error);
  }
}
