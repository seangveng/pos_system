import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

import connectDB from "@/lib/mongodb";
import OnlineOrder from "@/models/OnlineOrder";
import Product from "@/models/Product";
import User from "@/models/User";

import { ADMIN_SESSION_COOKIE, getAdminSession } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
] as const;

const PAYMENT_STATUSES = ["UNPAID", "PAID", "FAILED", "REFUNDED"] as const;

type OrderStatus = (typeof ORDER_STATUSES)[number];
type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

type AdminSession = {
  email: string;
  role: "OWNER" | "ADMIN" | "STAFF";
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function isOrderStatus(value: unknown): value is OrderStatus {
  return (
    typeof value === "string" && ORDER_STATUSES.includes(value as OrderStatus)
  );
}

function isPaymentStatus(value: unknown): value is PaymentStatus {
  return (
    typeof value === "string" &&
    PAYMENT_STATUSES.includes(value as PaymentStatus)
  );
}

// --------------------------------------------------
// AUTHENTICATION
// Supports environment OWNER and MongoDB OWNER,
// ADMIN and STAFF accounts.
// --------------------------------------------------

async function getAdmin(request: NextRequest): Promise<AdminSession | null> {
  try {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

    if (!token) return null;

    const session = getAdminSession(token);

    if (!session || !["OWNER", "ADMIN", "STAFF"].includes(session.role)) {
      return null;
    }

    const email = session.email.trim().toLowerCase();

    // Environment-based OWNER account.
    const envOwnerEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

    if (session.role === "OWNER" && envOwnerEmail && email === envOwnerEmail) {
      return {
        email,
        role: "OWNER",
      };
    }

    // Verify MongoDB OWNER, ADMIN and STAFF accounts.
    await connectDB();

    const user = await User.findOne({ email })
      .select("email role status")
      .lean();

    if (!user || user.status !== "ACTIVE") {
      return null;
    }

    if (user.role !== session.role) {
      return null;
    }

    if (!["OWNER", "ADMIN", "STAFF"].includes(user.role)) {
      return null;
    }

    return {
      email,
      role: user.role as AdminSession["role"],
    };
  } catch (error) {
    return null;
  }
}

// --------------------------------------------------
// GET: Retrieve one order by order number.
// --------------------------------------------------

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const admin = await getAdmin(request);

    if (!admin) {
      return errorResponse("Unauthorized. Please sign in again.", 401);
    }

    await connectDB();

    const { id } = await params;

    const order = await OnlineOrder.findOne({
      orderNumber: id,
    }).lean();

    if (!order) {
      return errorResponse("Order not found", 404);
    }

    return NextResponse.json(
      {
        order: JSON.parse(JSON.stringify(order)),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    );
  } catch (error) {
    return errorResponse("Failed to retrieve order", 500);
  }
}

// --------------------------------------------------
// PATCH: Approve orders and manage customer payments.
// --------------------------------------------------

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  let mongoSession: Awaited<
    ReturnType<typeof OnlineOrder.startSession>
  > | null = null;

  try {
    const admin = await getAdmin(request);

    if (!admin) {
      return errorResponse("Unauthorized. Please sign in again.", 401);
    }

    await connectDB();

    const { id } = await params;

    // VALIDATE REQUEST BODY

    let body: Record<string, unknown>;

    try {
      const parsedBody: unknown = await request.json();

      if (
        !parsedBody ||
        typeof parsedBody !== "object" ||
        Array.isArray(parsedBody)
      ) {
        return errorResponse("Invalid request body", 400);
      }

      body = parsedBody as Record<string, unknown>;
    } catch {
      return errorResponse("Invalid JSON request body", 400);
    }

    const hasStatus = Object.prototype.hasOwnProperty.call(body, "status");

    const hasPaymentStatus = Object.prototype.hasOwnProperty.call(
      body,
      "paymentStatus",
    );

    if (!hasStatus && !hasPaymentStatus) {
      return errorResponse("No valid fields to update", 400);
    }

    if (hasStatus && !isOrderStatus(body.status)) {
      return errorResponse("Invalid order status", 400);
    }

    if (hasPaymentStatus && !isPaymentStatus(body.paymentStatus)) {
      return errorResponse("Invalid payment status", 400);
    }

    const newStatus = hasStatus ? (body.status as OrderStatus) : undefined;

    const newPaymentStatus = hasPaymentStatus
      ? (body.paymentStatus as PaymentStatus)
      : undefined;

    // START MONGODB TRANSACTION

    mongoSession = await OnlineOrder.startSession();
    mongoSession.startTransaction();

    const order = await OnlineOrder.findOne({
      orderNumber: id,
    }).session(mongoSession);

    if (!order) {
      throw new Error("ORDER_NOT_FOUND");
    }

    // VALIDATE ORDER STATUS TRANSITIONS

    if (
      order.status === "CANCELLED" &&
      hasStatus &&
      newStatus !== "CANCELLED"
    ) {
      throw new Error("CANCELLED_ORDER");
    }

    if (order.status === "CANCELLED" && hasPaymentStatus) {
      throw new Error("CANCELLED_PAYMENT");
    }

    if (
      order.paymentStatus === "REFUNDED" &&
      hasPaymentStatus &&
      newPaymentStatus !== "REFUNDED"
    ) {
      throw new Error("REFUNDED_ORDER");
    }

    if (
      hasPaymentStatus &&
      newPaymentStatus === "REFUNDED" &&
      order.paymentStatus !== "PAID"
    ) {
      throw new Error("PAYMENT_NOT_PAID");
    }

    if (
      hasStatus &&
      newStatus === "CANCELLED" &&
      order.paymentStatus === "PAID"
    ) {
      throw new Error("REFUND_REQUIRED");
    }

    if (
      hasPaymentStatus &&
      newPaymentStatus === "PAID" &&
      order.status === "CANCELLED"
    ) {
      throw new Error("CANCELLED_PAYMENT");
    }

    // PAYMENT MANAGEMENT

    if (hasPaymentStatus && newPaymentStatus) {
      order.paymentStatus = newPaymentStatus;

      if (newPaymentStatus === "PAID") {
        order.paidAt = new Date();
      } else if (
        newPaymentStatus === "UNPAID" ||
        newPaymentStatus === "FAILED"
      ) {
        order.paidAt = null;
      }
    }

    // ORDER STATUS MANAGEMENT

    if (hasStatus && newStatus) {
      order.status = newStatus;

      if (newStatus === "CANCELLED") {
        order.cancelledAt = new Date();
      }
    }

    // RESTORE TRACKED PRODUCT STOCK ONCE

    if (hasStatus && newStatus === "CANCELLED" && !order.stockRestoredAt) {
      for (const item of order.items) {
        const product = await Product.findOne({
          id: item.productId,
        })
          .select("trackStock")
          .session(mongoSession);

        if (!product) {
          throw new Error("PRODUCT_RESTORE_FAILED");
        }

        if (product.trackStock !== true) {
          continue;
        }

        const result = await Product.updateOne(
          {
            id: item.productId,
            trackStock: true,
          },
          {
            $inc: {
              stock: item.quantity,
            },
          },
          {
            session: mongoSession,
          },
        );

        if (result.modifiedCount !== 1) {
          throw new Error("PRODUCT_RESTORE_FAILED");
        }
      }

      order.stockRestoredAt = new Date();
    }

    // SAVE ORDER

    await order.save({
      session: mongoSession,
    });

    await mongoSession.commitTransaction();

    // INVALIDATE CACHED ORDER DATA

    revalidateTag("admin-online-orders");
    revalidateTag("admin-transactions");

    return NextResponse.json(
      {
        message: "Order updated successfully",
        order: JSON.parse(JSON.stringify(order)),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    );
  } catch (error) {
    if (mongoSession?.inTransaction()) {
      await mongoSession.abortTransaction();
    }

    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

    const errors: Record<string, { message: string; status: number }> = {
      ORDER_NOT_FOUND: {
        message: "Order not found",
        status: 404,
      },
      CANCELLED_ORDER: {
        message: "A cancelled order cannot be reopened",
        status: 400,
      },
      CANCELLED_PAYMENT: {
        message: "Payment cannot be changed for a cancelled order",
        status: 400,
      },
      REFUNDED_ORDER: {
        message: "A refunded payment cannot be changed",
        status: 400,
      },
      PAYMENT_NOT_PAID: {
        message: "Only paid orders can be refunded",
        status: 400,
      },
      REFUND_REQUIRED: {
        message: "Refund the payment before cancelling this order",
        status: 400,
      },
      PRODUCT_RESTORE_FAILED: {
        message: "Could not restore product stock. No changes were saved.",
        status: 500,
      },
    };

    const knownError = errors[message];

    if (knownError) {
      return errorResponse(knownError.message, knownError.status);
    }

    return errorResponse("Failed to update order", 500);
  } finally {
    if (mongoSession) {
      await mongoSession.endSession();
    }
  }
}
