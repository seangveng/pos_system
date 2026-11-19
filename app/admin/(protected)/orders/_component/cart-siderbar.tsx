"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Minus,
  Plus,
  ShoppingBag,
  ShoppingCart,
  X,
  CreditCard,
  Banknote,
  CheckCircle2,
} from "lucide-react";

import {
  useCartDispatch,
  useCartState,
} from "../../../../../contexts/cart-context";

import { Button } from "../../../../../components/ui/button";
import { Input } from "../../../../../components/ui/input";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogHeader,
  DialogFooter,
} from "../../../../../components/ui/dialog";

import { useTranslation } from "../../../../../hooks/use-translation";

type PaymentGateway =
  | "CASH"
  | "CARD"
  | "ABA"
  | "ACLEDA"
  | "KHQR"
  | "PAYPAL"
  | "STRIPE";

type CartMode = "customer" | "staff";

type CartSidebarProps = {
  mode?: CartMode;
};

type CompletedOrder = {
  orderNumber: string;
  customerName: string;
  paymentMethod: PaymentGateway;
  paymentStatus: string;
  total: number;
  itemCount: number;
};

type ApiOrder = {
  orderNumber: string;
  paymentStatus: string;
  total: number;
  discount?: number;
  promoCode?: string | null;
};

type PromoValidation = {
  valid: boolean;
  promoCode: string;
  discount: number;
  error?: string;
};

const slideIn = `
@keyframes slideInRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
.animate-slideInRight {
  animation: slideInRight 0.3s ease-out forwards;
}
`;

export function CartSidebar({ mode = "staff" }: CartSidebarProps) {
  const isStaff = mode === "staff";
  const isCustomer = mode === "customer";

  const { t, locale } = useTranslation();

  const { items } = useCartState();
  const dispatch = useCartDispatch();
  const router = useRouter();

  const PAYMENT_METHODS: {
    value: PaymentGateway;
    label: string;
  }[] = [
    { value: "CASH", label: t("cart.paymentMethods.cash") },
    { value: "CARD", label: t("cart.paymentMethods.card") },
    { value: "ABA", label: t("cart.paymentMethods.aba") },
    { value: "ACLEDA", label: t("cart.paymentMethods.acleda") },
    { value: "KHQR", label: t("cart.paymentMethods.khqr") },
    { value: "PAYPAL", label: t("cart.paymentMethods.paypal") },
    { value: "STRIPE", label: t("cart.paymentMethods.stripe") },
  ];

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);

  const [paymentGateway, setPaymentGateway] = useState<PaymentGateway>("CASH");

  const [mounted, setMounted] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const [completedOrder, setCompletedOrder] = useState<CompletedOrder | null>(
    null,
  );

  const [errorMessage, setErrorMessage] = useState("");
  const [promoMessage, setPromoMessage] = useState("");

  useEffect(() => {
    setMounted(true);

    if (!document.getElementById("slideInStyle")) {
      const style = document.createElement("style");
      style.id = "slideInStyle";
      style.innerHTML = slideIn;
      document.head.appendChild(style);
    }
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal =
    Math.round(
      items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100,
    ) / 100;

  const discount = Math.min(subtotal, promoDiscount);
  const estimatedDeliveryFee = 0;

  const estimatedTotal =
    Math.round((subtotal - discount + estimatedDeliveryFee) * 100) / 100;

  const formatDigits = (value: number | string) => {
    if (locale !== "km") return String(value);

    const khmerDigits = "០១២៣៤៥៦៧៨៩";

    return String(value).replace(/\d/g, (digit) => khmerDigits[Number(digit)]);
  };

  const formatMoney = (value: number) => `$${value.toFixed(2)}`;

  if (!mounted) return null;

  const updateQuantity = (key: string, quantity: number) => {
    if (quantity <= 0) {
      dispatch({
        type: "REMOVE_ITEM",
        payload: key,
      });
      return;
    }

    dispatch({
      type: "UPDATE_QUANTITY",
      payload: {
        key,
        quantity,
      },
    });
  };

  const handleClearCart = () => {
    dispatch({ type: "CLEAR_CART" });

    setAppliedPromo("");
    setPromoDiscount(0);
    setPromoMessage("");
    setPromoCode("");
  };

  const handleApplyPromo = async () => {
    const normalized = promoCode.trim().toUpperCase();

    if (!normalized) return;

    if (subtotal <= 0) {
      setPromoMessage(t("cart.errors.addProductsFirst"));
      return;
    }

    try {
      setIsValidatingPromo(true);
      setPromoMessage("");
      setErrorMessage("");

      const response = await fetch("/api/promos/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          code: normalized,
          subtotal,
        }),
      });

      const result = (await response.json()) as PromoValidation;

      if (!response.ok || !result.valid) {
        throw new Error(result.error || t("cart.errors.invalidPromo"));
      }

      setAppliedPromo(result.promoCode);
      setPromoDiscount(result.discount);
      setPromoCode("");

      setPromoMessage(
        t("cart.promoApplied", {
          amount: result.discount.toFixed(2),
        }),
      );
    } catch (error) {
      setAppliedPromo("");
      setPromoDiscount(0);

      setPromoMessage(
        error instanceof Error
          ? error.message
          : t("cart.errors.unableToValidatePromo"),
      );
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo("");
    setPromoDiscount(0);
    setPromoMessage("");
    setErrorMessage("");
  };

  const handleOpenPayment = () => {
    setErrorMessage("");

    if (items.length === 0) {
      setErrorMessage(t("cart.errors.empty"));
      return;
    }

    setShowPaymentDialog(true);
  };

  const handleConfirmPayment = async () => {
    if (items.length === 0) {
      setErrorMessage(t("cart.errors.empty"));
      return;
    }

    if (isProcessingPayment) return;

    if (
      isCustomer &&
      (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim())
    ) {
      setErrorMessage(t("cart.errors.customerInformationRequired"));
      return;
    }

    try {
      setIsProcessingPayment(true);
      setErrorMessage("");

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          orderSource: isStaff ? "STAFF" : "ONLINE",

          customer: {
            name: customerName.trim() || "Walk-in Customer",
            phone: isStaff ? "" : customerPhone.trim(),
            address: isStaff ? "" : customerAddress.trim(),
            notes: "",
          },

          paymentMethod: paymentGateway,
          promoCode: appliedPromo || "",

          items: items.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.code && String(result.code).startsWith("PROMO_")) {
          setAppliedPromo("");
          setPromoDiscount(0);
          setPromoMessage(result.error || t("cart.errors.promoNoLongerValid"));
        }

        throw new Error(result.error || t("cart.errors.unableToCreateOrder"));
      }

      const order = result.order as ApiOrder;

      if (!order?.orderNumber || typeof order.total !== "number") {
        throw new Error(t("cart.errors.invalidOrderResponse"));
      }

      setCompletedOrder({
        orderNumber: order.orderNumber,
        customerName: customerName.trim() || "Walk-in Customer",
        paymentMethod: paymentGateway,
        paymentStatus: order.paymentStatus,
        total: order.total,
        itemCount: totalItems,
      });

      // Clear cart only after successful order creation.
      dispatch({ type: "CLEAR_CART" });
      dispatch({ type: "CLOSE_CART" });

      setCustomerName("");
      setCustomerPhone("");
      setCustomerAddress("");
      setPromoCode("");
      setAppliedPromo("");
      setPromoDiscount(0);
      setPromoMessage("");
      setPaymentGateway("CASH");

      setShowPaymentDialog(false);
      setShowMobileCart(false);
      setShowSuccessDialog(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : t("cart.errors.tryAgain"),
      );
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const CartContent = (
    <div className="flex w-80 max-w-full flex-col rounded-lg border bg-white shadow-md">
      {/* Cart Header */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 px-4 py-2">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-gray-700" />

          <h2 className="text-sm font-semibold text-gray-900">
            {t("cart.title")}
          </h2>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={handleClearCart}
            className="text-xs text-red-500 hover:text-red-700 hover:underline"
          >
            {t("cart.clearAll")}
          </button>
        )}
      </div>

      {/* Item Count */}
      {totalItems > 0 && (
        <div className="px-4 pt-2">
          <span className="block text-center text-xs text-gray-500">
            {t("cart.yourOrderCount", {
              count: formatDigits(totalItems),
            })}
          </span>
        </div>
      )}

      {/* Cart Items */}
      <div className="max-h-96 flex-1 space-y-4 overflow-y-auto px-4 py-2">
        {items.length === 0 ? (
          <div className="py-8 text-center">
            <ShoppingCart className="mx-auto h-8 w-8 text-gray-300" />

            <p className="mt-2 text-sm text-gray-500">{t("cart.empty")}</p>
          </div>
        ) : (
          items.slice(0, 6).map((item) => {
            const key = `${item.id}-${item.size ?? ""}-${item.color ?? ""}`;

            return (
              <div key={key} className="flex gap-3">
                <img
                  src={item.image || "/placeholder.svg"}
                  alt={item.name}
                  className="h-14 w-14 flex-shrink-0 rounded-lg border object-cover"
                />

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-medium text-gray-900">
                    {item.name}
                  </h3>

                  <p className="text-xs text-gray-500">{item.category}</p>

                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                    <span>
                      {t("cart.size")}:{" "}
                      {item.size
                        ? t(`products.options.sizes.${item.size.toLowerCase()}`)
                        : t("common.notAvailable")}
                    </span>

                    <span>
                      {t("cart.color")}:{" "}
                      {item.color
                        ? t(
                            `products.options.colors.${item.color.toLowerCase()}`,
                          )
                        : t("common.notAvailable")}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(key, item.quantity - 1)}
                        className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 hover:bg-gray-50"
                      >
                        <Minus className="h-3 w-3" />
                      </button>

                      <span className="min-w-4 text-center text-sm font-medium">
                        {formatDigits(item.quantity)}
                      </span>

                      <button
                        type="button"
                        onClick={() => updateQuantity(key, item.quantity + 1)}
                        className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 hover:bg-gray-50"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <span className="text-sm font-semibold text-gray-900">
                      {formatMoney(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {items.length > 6 && (
        <div className="px-4 py-2 text-center">
          <p className="text-xs text-gray-500">
            {t("cart.moreItemsCount", {
              count: formatDigits(items.length - 6),
            })}
          </p>
        </div>
      )}

      {/* Customer / Promo */}
      <div className="flex-shrink-0 border-t border-gray-200">
        <div className="space-y-2 px-4 py-2">
          <Input
            placeholder={isStaff ? t("cart.customerName") : t("cart.yourName")}
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
            className="mb-2 h-8 text-sm"
          />

          {appliedPromo ? (
            <div className="flex items-center justify-between rounded border border-green-200 bg-green-50 px-2 py-1">
              <div className="min-w-0">
                <span className="block text-xs font-medium text-green-700">
                  {t("cart.promo")}: {appliedPromo}
                </span>

                <span className="text-xs text-green-700">
                  {t("cart.saved")} {formatMoney(promoDiscount)}
                </span>
              </div>

              <button
                type="button"
                onClick={handleRemovePromo}
                className="ml-2 text-xs text-red-500"
                aria-label={t("cart.removePromo")}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder={t("cart.promoCode")}
                value={promoCode}
                onChange={(event) => setPromoCode(event.target.value)}
                className="h-8 flex-1 text-sm"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleApplyPromo();
                  }
                }}
              />

              <Button
                type="button"
                onClick={() => void handleApplyPromo()}
                disabled={!promoCode.trim() || isValidatingPromo}
                className="h-8 bg-gray-600 px-2 text-xs text-white hover:bg-gray-700"
              >
                {isValidatingPromo ? t("cart.checking") : t("cart.apply")}
              </Button>
            </div>
          )}

          {promoMessage && (
            <p
              role="status"
              className={`text-xs ${
                appliedPromo ? "text-green-600" : "text-red-500"
              }`}
            >
              {promoMessage}
            </p>
          )}
        </div>

        {/* Cart Summary */}
        <div className="space-y-1 px-4 py-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">{t("cart.subtotal")}</span>
            <span>{formatMoney(subtotal)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">{t("cart.promoDiscount")}</span>
            <span className="text-green-600">-{formatMoney(discount)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">{t("cart.delivery")}</span>
            <span>{formatMoney(estimatedDeliveryFee)}</span>
          </div>

          <div className="flex justify-between border-t border-gray-200 pt-2">
            <span className="font-semibold text-gray-900">
              {t("cart.estimatedTotal")}
            </span>

            <span className="font-semibold text-gray-900">
              {formatMoney(estimatedTotal)}
            </span>
          </div>
        </div>

        {/* Proceed Payment */}
        <div className="border-t border-gray-200 px-4 py-2">
          <Button
            type="button"
            onClick={handleOpenPayment}
            disabled={items.length === 0 || isProcessingPayment}
            className="w-full bg-teal-600 text-white hover:bg-teal-700"
          >
            <ShoppingBag className="mr-2 h-4 w-4" />
            {isStaff ? t("cart.proceedPayment") : t("cart.placeOrder")}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Cart */}
      <div
        className={
          isStaff
            ? "sticky top-0 hidden h-[calc(100vh-100px)] self-start overflow-y-auto p-3 sm:block"
            : "sticky top-4 hidden max-h-[calc(100vh-100px)] self-start overflow-y-auto sm:block"
        }
      >
        {CartContent}
      </div>

      {/* Mobile Cart Button */}
      <button
        type="button"
        onClick={() => setShowMobileCart(true)}
        className="fixed right-14 top-3 z-50 rounded-full border bg-white p-2 shadow-md sm:hidden"
        aria-label={t("cart.title")}
      >
        <ShoppingCart className="h-4 w-4 text-black/90" />

        {totalItems > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-teal-600 px-1 text-[10px] text-white">
            {formatDigits(totalItems)}
          </span>
        )}
      </button>

      {/* Mobile Cart Drawer */}
      {showMobileCart && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/50 sm:hidden"
          onClick={() => setShowMobileCart(false)}
        >
          <div
            className="relative h-full w-80 max-w-[90vw] animate-slideInRight bg-white shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowMobileCart(false)}
              className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border bg-white shadow-sm"
              aria-label={t("common.close")}
            >
              <X className="h-4 w-4" />
            </button>

            {CartContent}
          </div>
        </div>
      )}

      {/* Payment Dialog */}
      <Dialog
        open={showPaymentDialog}
        onOpenChange={(open) => {
          if (!isProcessingPayment) {
            setShowPaymentDialog(open);

            if (open) {
              setErrorMessage("");
            }
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {isStaff ? t("cart.confirmPOSOrder") : t("cart.confirmYourOrder")}
            </DialogTitle>

            <DialogDescription>
              {isStaff
                ? t("cart.confirmPOSDescription")
                : t("cart.confirmCustomerDescription")}
            </DialogDescription>
          </DialogHeader>

          {/* Customer Information */}
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                {t("cart.customerName")}
              </label>

              <Input
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder={
                  isStaff ? t("cart.walkInCustomer") : t("cart.yourName")
                }
              />
            </div>

            {isCustomer && (
              <>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    {t("cart.phoneNumber")}
                  </label>

                  <Input
                    value={customerPhone}
                    onChange={(event) => setCustomerPhone(event.target.value)}
                    placeholder={t("cart.phoneNumber")}
                    type="tel"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    {t("cart.deliveryAddress")}
                  </label>

                  <Input
                    value={customerAddress}
                    onChange={(event) => setCustomerAddress(event.target.value)}
                    placeholder={t("cart.deliveryAddress")}
                  />
                </div>
              </>
            )}
          </div>

          {/* Payment Methods */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {t("cart.paymentMethod")}
            </label>

            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setPaymentGateway(method.value)}
                  className={`flex items-center gap-2 rounded-lg border p-3 text-left transition ${
                    paymentGateway === method.value
                      ? "border-teal-600 bg-teal-50 text-teal-700"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {method.value === "CASH" ? (
                    <Banknote className="h-4 w-4" />
                  ) : method.value === "CARD" ? (
                    <CreditCard className="h-4 w-4" />
                  ) : null}

                  <span className="text-sm">{method.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {errorMessage && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {errorMessage}
            </div>
          )}

          {/* Order Summary */}
          <div className="space-y-2 rounded-lg bg-gray-50 p-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{t("cart.items")}</span>
              <span>{formatDigits(totalItems)}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{t("cart.subtotal")}</span>
              <span>{formatMoney(subtotal)}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{t("cart.discount")}</span>
              <span className="text-green-600">-{formatMoney(discount)}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{t("cart.delivery")}</span>
              <span>{formatMoney(estimatedDeliveryFee)}</span>
            </div>

            <div className="flex justify-between border-t pt-2">
              <span className="font-semibold">{t("cart.estimatedTotal")}</span>
              <span className="font-bold">{formatMoney(estimatedTotal)}</span>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              disabled={isProcessingPayment || items.length === 0}
              className="w-full bg-teal-600 text-white hover:bg-teal-700"
              onClick={handleConfirmPayment}
            >
              {isProcessingPayment ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {t("cart.processing")}
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {t("cart.confirmOrder")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>

            <DialogTitle className="text-center text-xl">
              {isCustomer
                ? t("cart.orderPlacedSuccessfully")
                : completedOrder?.paymentStatus === "PAID"
                  ? t("cart.paymentSuccessful")
                  : completedOrder?.paymentStatus === "UNPAID"
                    ? t("cart.orderCreated")
                    : t("cart.orderCreated")}
            </DialogTitle>

            <DialogDescription className="text-center">
              {isCustomer
                ? t("cart.orderReceivedDescription")
                : completedOrder?.paymentStatus === "PAID"
                  ? t("cart.paymentRecordedDescription")
                  : completedOrder?.paymentStatus === "UNPAID"
                    ? t("cart.paymentPendingDescription")
                    : t("cart.paymentPendingDescription")}
            </DialogDescription>
          </DialogHeader>

          {completedOrder && (
            <div className="space-y-3 rounded-lg border bg-gray-50 p-4">
              <div className="flex items-start justify-between gap-4">
                <span className="text-sm text-gray-500">
                  {t("cart.orderNumber")}
                </span>

                <span className="break-all text-right text-sm font-semibold">
                  {completedOrder.orderNumber}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-500">
                  {t("cart.customer")}
                </span>

                <span className="text-sm font-medium">
                  {completedOrder.customerName}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-500">
                  {t("cart.payment")}
                </span>

                <span className="text-sm font-medium">
                  {PAYMENT_METHODS.find(
                    (method) => method.value === completedOrder.paymentMethod,
                  )?.label ?? completedOrder.paymentMethod}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-500">
                  {t("cart.paymentStatus")}
                </span>

                <span className="text-sm font-medium">
                  {completedOrder?.paymentStatus
                    ? t(
                        `cart.paymentStatuses.${completedOrder.paymentStatus.toLowerCase()}`,
                      )
                    : "-"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-500">{t("cart.items")}</span>

                <span className="text-sm font-medium">
                  {formatDigits(completedOrder.itemCount)}
                </span>
              </div>

              <div className="flex items-center justify-between border-t pt-3">
                <span className="font-semibold">{t("cart.total")}</span>

                <span className="text-xl font-bold text-teal-600">
                  {formatMoney(completedOrder.total)}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setShowSuccessDialog(false)}
            >
              {isCustomer ? t("cart.continueShopping") : t("common.close")}
            </Button>

            {isStaff && (
              <Button
                type="button"
                className="w-full bg-teal-600 text-white hover:bg-teal-700 sm:w-auto"
                onClick={() => {
                  setShowSuccessDialog(false);
                  router.push("/admin/orders");
                }}
              >
                {t("cart.viewOrders")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
