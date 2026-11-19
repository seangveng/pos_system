"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCartDispatch, useCartState } from "@/contexts/cart-context";

const money = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);

export default function CheckoutPage() {
  const router = useRouter();
  const { items } = useCartState();
  const dispatch = useCartDispatch();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { name, phone, address, notes },
          paymentMethod,
          items: items.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not place your order.");
      }

      dispatch({ type: "CLEAR_CART" });

      const params = new URLSearchParams({
        order: data.order.orderNumber,
        phone,
      });

      router.push(`/orders?${params.toString()}`);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not place your order.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border bg-white p-10 text-center">
        <h1 className="text-2xl font-black">Your cart is empty</h1>
        <p className="mt-2 text-slate-500">
          Add products to your cart before checking out.
        </p>
        <Link
          href="/"
          className="mt-5 inline-block rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_360px]">
      <section>
        <h1 className="text-3xl font-black">Checkout</h1>
        <p className="mt-2 text-slate-500">
          Enter your details for order delivery.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-5 rounded-2xl border bg-white p-6"
        >
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-bold">
              Full name
            </label>
            <input
              id="name"
              required
              maxLength={120}
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-xl border px-4 py-3 outline-none focus:border-emerald-600"
              placeholder="Your full name"
            />
          </div>

          <div>
            <label htmlFor="phone" className="mb-2 block text-sm font-bold">
              Phone number
            </label>
            <input
              id="phone"
              required
              maxLength={30}
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="w-full rounded-xl border px-4 py-3 outline-none focus:border-emerald-600"
              placeholder="Your phone number"
            />
          </div>

          <div>
            <label htmlFor="address" className="mb-2 block text-sm font-bold">
              Delivery address
            </label>
            <textarea
              id="address"
              required
              maxLength={500}
              autoComplete="street-address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              className="min-h-24 w-full rounded-xl border px-4 py-3 outline-none focus:border-emerald-600"
              placeholder="House number, street, district, province..."
            />
          </div>

          <div>
            <label htmlFor="payment" className="mb-2 block text-sm font-bold">
              Payment method
            </label>
            <select
              id="payment"
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
              className="w-full rounded-xl border bg-white px-4 py-3"
            >
              <option value="CASH">Cash on delivery</option>
              <option value="ABA">ABA Bank (manual arrangement)</option>
              <option value="ACLEDA">ACLEDA (manual arrangement)</option>
              <option value="KHQR">KHQR (manual arrangement)</option>
              <option value="CARD">Card (not yet integrated)</option>
              <option value="PAYPAL">PayPal (not yet integrated)</option>
              <option value="STRIPE">Stripe (not yet integrated)</option>
            </select>
            <p className="mt-2 text-xs text-slate-500">
              Selecting a method records your preference only. Online payments
              are not processed by this code.
            </p>
          </div>

          <div>
            <label htmlFor="notes" className="mb-2 block text-sm font-bold">
              Order notes (optional)
            </label>
            <textarea
              id="notes"
              maxLength={500}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="min-h-20 w-full rounded-xl border px-4 py-3"
              placeholder="Delivery instructions..."
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? "Placing order..." : "Place order"}
          </button>
        </form>
      </section>

      <aside className="h-fit rounded-2xl border bg-white p-6">
        <h2 className="text-xl font-black">Order summary</h2>

        <div className="mt-5 space-y-4">
          {items.map((item, index) => (
            <div
              key={`${item.id}-${item.size}-${item.color}-${index}`}
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

        <div className="mt-5 border-t pt-4">
          <div className="flex justify-between">
            <span className="text-slate-600">Subtotal</span>
            <span className="font-bold">{money(subtotal)}</span>
          </div>
          <div className="mt-3 flex justify-between text-lg">
            <span className="font-bold">Estimated total</span>
            <span className="font-black">{money(subtotal)}</span>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            The server calculates the final order total using current database
            prices. Delivery is currently set to zero.
          </p>
        </div>
      </aside>
    </div>
  );
}
