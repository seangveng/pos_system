"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Order = {
  orderNumber: string;
  customer: { name: string };
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  createdAt: string;
};

const money = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);

const statusClasses: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-indigo-100 text-indigo-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function OrdersPage() {
  const searchParams = useSearchParams();

  const [orderNumber, setOrderNumber] = useState(
    searchParams.get("order") ?? "",
  );
  const [phone, setPhone] = useState(searchParams.get("phone") ?? "");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function lookupOrder(
    submittedOrderNumber: string,
    submittedPhone: string,
  ) {
    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const params = new URLSearchParams({
        order: submittedOrderNumber.trim(),
        phone: submittedPhone.trim(),
      });

      const response = await fetch(`/api/orders?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to find order.");
      }

      setOrder(data.order);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to find order.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const orderFromUrl = searchParams.get("order") ?? "";
    const phoneFromUrl = searchParams.get("phone") ?? "";

    if (orderFromUrl && phoneFromUrl) {
      void lookupOrder(orderFromUrl, phoneFromUrl);
    }
    // Lookup on initial URL changes, including the post-checkout redirect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void lookupOrder(orderNumber, phone);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <div>
        <p className="text-sm font-bold uppercase tracking-widest text-emerald-700">
          Order support
        </p>
        <h1 className="mt-2 text-3xl font-black">Track your order</h1>
        <p className="mt-2 text-slate-500">
          Enter the order number and phone number you used at checkout.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border bg-white p-6"
      >
        <div>
          <label htmlFor="orderNumber" className="mb-2 block text-sm font-bold">
            Order number
          </label>
          <input
            id="orderNumber"
            required
            value={orderNumber}
            onChange={(event) => setOrderNumber(event.target.value)}
            placeholder="ORD-..."
            className="w-full rounded-xl border px-4 py-3"
          />
        </div>

        <div>
          <label htmlFor="phone" className="mb-2 block text-sm font-bold">
            Checkout phone number
          </label>
          <input
            id="phone"
            required
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Phone number"
            className="w-full rounded-xl border px-4 py-3"
          />
        </div>

        <button
          disabled={loading}
          className="w-full rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white disabled:opacity-50"
        >
          {loading ? "Searching..." : "Find my order"}
        </button>

        {error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}
      </form>

      {order && (
        <section className="space-y-5 rounded-2xl border bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">Order number</p>
              <h2 className="mt-1 break-all text-xl font-black">
                {order.orderNumber}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Ordered {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-sm font-bold ${
                statusClasses[order.status] ?? "bg-slate-100 text-slate-700"
              }`}
            >
              {order.status}
            </span>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Customer</p>
            <p className="font-bold">{order.customer.name}</p>
            <p className="mt-3 text-sm text-slate-500">Payment</p>
            <p className="font-semibold">
              {order.paymentMethod} · {order.paymentStatus}
            </p>
          </div>

          <div>
            <h3 className="font-bold">Items</h3>
            <div className="mt-3 space-y-3">
              {order.items.map((item, index) => (
                <div
                  key={`${item.name}-${index}`}
                  className="flex justify-between gap-4 text-sm"
                >
                  <span className="text-slate-600">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="shrink-0 font-semibold">
                    {money(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 border-t pt-4">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal</span>
              <span>{money(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Delivery</span>
              <span>{money(order.deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-lg font-black">
              <span>Total</span>
              <span>{money(order.total)}</span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
