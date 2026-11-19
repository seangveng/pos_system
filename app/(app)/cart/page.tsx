"use client";

import Link from "next/link";
import {
  useCartDispatch,
  useCartState,
  getCartItemKey,
} from "@/contexts/cart-context";

const money = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);

export default function CartPage() {
  const { items } = useCartState();
  const dispatch = useCartDispatch();

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  function updateQuantity(item: (typeof items)[number], quantity: number) {
    dispatch({
      type: "UPDATE_QUANTITY",
      payload: { key: getCartItemKey(item), quantity },
    });
  }

  function removeItem(item: (typeof items)[number]) {
    dispatch({
      type: "REMOVE_ITEM",
      payload: getCartItemKey(item),
    });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-black">Your cart</h1>
        <p className="mt-2 text-slate-500">
          Review your products before checkout.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border bg-white p-10 text-center">
          <p className="text-lg font-bold">Your cart is empty</p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white"
          >
            Browse products
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((item) => (
              <article
                key={getCartItemKey(item)}
                className="flex flex-col gap-4 rounded-2xl border bg-white p-4 sm:flex-row sm:items-center"
              >
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="text-3xl text-slate-300">▧</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="font-bold">{item.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {item.category}
                    {item.size ? ` · Size: ${item.size}` : ""}
                    {item.color ? ` · Color: ${item.color}` : ""}
                  </p>
                  <p className="mt-2 font-bold">{money(item.price)}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    aria-label={`Decrease quantity of ${item.name}`}
                    onClick={() => updateQuantity(item, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    className="h-9 w-9 rounded-lg border disabled:opacity-40"
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-bold">
                    {item.quantity}
                  </span>
                  <button
                    aria-label={`Increase quantity of ${item.name}`}
                    onClick={() => updateQuantity(item, item.quantity + 1)}
                    className="h-9 w-9 rounded-lg border"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => removeItem(item)}
                  className="text-sm font-semibold text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </article>
            ))}
          </div>

          <div className="rounded-2xl border bg-white p-6">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Subtotal</span>
              <span className="text-xl font-black">{money(subtotal)}</span>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Delivery charges, if any, will be confirmed at checkout.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/"
                className="rounded-xl border px-5 py-3 text-center font-bold"
              >
                Continue shopping
              </Link>
              <Link
                href="/checkout"
                className="rounded-xl bg-emerald-600 px-5 py-3 text-center font-bold text-white hover:bg-emerald-700"
              >
                Continue to checkout
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
