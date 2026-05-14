"use client";

import { useEffect, useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Lock, ChevronDown, ChevronUp, Check } from "lucide-react";
import useBasketStore from "@/store/store";
import useLocationStore from "@/store/locationStore";
import { formatPrice } from "@/lib/utils";
import { imageUrl } from "@/lib/imageUrl";
import type { CustomerAddress } from "@/sanity/lib/addresses";
import { getMyDefaultAddressAction } from "@/actions/addressActions";

type Step = 1 | 2 | 3;

const DELIVERY_SPEEDS = [
  { id: "standard", label: "Standard Delivery (3–5 business days)", price: 0 },
  { id: "express", label: "Express Delivery (1–2 business days)", price: 99 },
];

function StepHeader({
  step,
  activeStep,
  title,
  summary,
  onEdit,
}: {
  step: Step;
  activeStep: Step;
  title: string;
  summary?: React.ReactNode;
  onEdit?: () => void;
}) {
  const isDone = step < activeStep;
  const isActive = step === activeStep;

  return (
    <div
      className={`flex items-center justify-between px-5 py-3 ${
        isActive ? "bg-white" : "bg-[#F7F8F8]"
      } border-b border-[#ddd]`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
            isDone
              ? "bg-[#007600] text-white"
              : isActive
              ? "bg-[#131921] text-white"
              : "border-2 border-[#c8c8c8] text-[#c8c8c8]"
          }`}
        >
          {isDone ? <Check className="w-3.5 h-3.5" /> : step}
        </span>
        <div>
          <h2
            className={`text-sm font-bold ${
              isActive ? "text-[#e77600]" : isDone ? "text-[#0F1111]" : "text-[#565959]"
            }`}
          >
            {title}
          </h2>
          {isDone && summary && (
            <p className="text-xs text-[#565959]">{summary}</p>
          )}
        </div>
      </div>
      {isDone && onEdit && (
        <button
          onClick={onEdit}
          className="text-xs text-[#007185] hover:text-[#C7511F] hover:underline"
        >
          Change
        </button>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  const { user, isLoaded } = useUser();
  const { redirectToSignIn } = useClerk();
  const router = useRouter();
  const { items, getTotalPrice } = useBasketStore();
  const { country, currency } = useLocationStore();

  const [activeStep, setActiveStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 — Address
  const [defaultAddress, setDefaultAddress] = useState<CustomerAddress | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState(useLocationStore.getState().city || "");
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState("");
  const [usingSaved, setUsingSaved] = useState(false);

  // Step 2 — Payment
  const [paymentMethod, setPaymentMethod] = useState<"card" | "eft">("card");

  // Step 3 — Delivery speed
  const [deliverySpeed, setDeliverySpeed] = useState(DELIVERY_SPEEDS[0].id);

  // Auth gate
  useEffect(() => {
    if (isLoaded && !user) {
      redirectToSignIn({ redirectUrl: window.location.href });
    }
  }, [isLoaded, user, redirectToSignIn]);

  // Pre-fill from default address
  useEffect(() => {
    if (!isLoaded || !user) return;
    getMyDefaultAddressAction()
      .then((addr) => {
        if (addr) {
          setDefaultAddress(addr);
          setStreetAddress(addr.streetAddress);
          setCity(addr.city);
          setPostalCode(addr.postalCode);
          setPhone(addr.phone);
          setUsingSaved(true);
        }
      })
      .finally(() => setLoadingAddress(false));
  }, [isLoaded, user]);

  const subtotal = getTotalPrice();
  const shippingBase = country === "ZA" ? 100 : 350;
  const speedExtra =
    DELIVERY_SPEEDS.find((s) => s.id === deliverySpeed)?.price ?? 0;
  const shipping = shippingBase + speedExtra;
  const tax = subtotal * 0.15;
  const total = subtotal + shipping + tax;

  const handleConfirmAddress = () => {
    if (!streetAddress || !city || !postalCode || !phone) {
      setError("Please fill in all required address fields.");
      return;
    }
    setError(null);
    setActiveStep(2);
  };

  const handleConfirmPayment = () => {
    setActiveStep(3);
  };

  const handlePlaceOrder = async () => {
    if (!isLoaded || items.length === 0) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const email =
        user?.emailAddresses[0]?.emailAddress || "guest@tumirathumela.com";
      const customerName = user
        ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
        : "Customer";

      const sanityOrderItems = items.map((item) => ({
        _key: Math.random().toString(36).slice(2),
        product: { _type: "reference", _ref: item.product._id },
        quantity: item.quantity,
      }));

      const payload = {
        amount: Math.round(total * 100),
        currency: "ZAR",
        metadata: {
          userId: user?.id,
          customerName,
          customerEmail: email,
          shippingAddress: `${streetAddress}, ${city}, ${postalCode}, ${
            country === "ZA" ? "South Africa" : "Zimbabwe"
          }`,
          shippingPhone: phone,
          deliverySpeed,
          paymentMethod,
          totalTax: Math.round(tax * 100),
        },
        lineItems: items.map((item) => ({
          name: item.product.name || "Product",
          quantity: item.quantity,
          unitPrice: Math.round((item.product.price || 0) * 100),
          totalAmount:
            Math.round((item.product.price || 0) * 100) * item.quantity,
          description: `SKU: ${item.product.sku || item.product._id}`,
        })),
        sanityOrderItems,
        subtotalAmount: Math.round(subtotal * 100),
        totalDiscount: 0,
        successUrl: `${window.location.origin}/success`,
        cancelUrl: `${window.location.origin}/checkout`,
        failureUrl: `${window.location.origin}/checkout`,
      };

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create checkout");
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        throw new Error("No redirect URL from payment provider");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  // Loading states
  if (!isLoaded || loadingAddress) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EAEDED]">
        <Loader2 className="animate-spin w-8 h-8 text-[#e77600]" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#EAEDED] p-4">
        <h1 className="text-2xl font-bold text-[#0F1111] mb-4">
          Your cart is empty
        </h1>
        <Link
          href="/"
          className="bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-sm px-6 py-2 text-sm font-normal text-[#0F1111] transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EAEDED]">
      {/* Minimal checkout header */}
      <header className="bg-white border-b border-[#ddd] px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-[#131921]">
            TumiraThumela
          </Link>
          <div className="flex items-center gap-1.5 text-sm text-[#565959]">
            <Lock className="w-4 h-4" />
            <span>Secure checkout</span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
        {/* ── Accordion steps ───────────────────────────────────────────── */}
        <div className="flex-1 space-y-3">

          {/* ── Step 1: Delivery Address ───────────────────────────────── */}
          <div className="bg-white rounded border border-[#ddd] overflow-hidden">
            <StepHeader
              step={1}
              activeStep={activeStep}
              title="1  Delivery address"
              summary={
                activeStep > 1
                  ? `${streetAddress}, ${city}, ${postalCode}`
                  : undefined
              }
              onEdit={() => setActiveStep(1)}
            />

            {activeStep === 1 && (
              <div className="p-5 space-y-4">
                {usingSaved && defaultAddress && (
                  <div className="bg-[#EAF7EF] border border-[#007600] rounded-sm p-3 text-sm text-[#007600] flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>
                      Pre-filled from your default address.{" "}
                      <Link
                        href="/account/addresses"
                        className="underline font-medium"
                      >
                        Manage addresses
                      </Link>
                    </span>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-[#0F1111] mb-1">
                    Street address <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    required
                    placeholder="123 Main St"
                    className="w-full border border-[#888c8c] rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e77600]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-[#0F1111] mb-1">
                      City <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                      className="w-full border border-[#888c8c] rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e77600]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0F1111] mb-1">
                      Postal code <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      required
                      className="w-full border border-[#888c8c] rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e77600]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0F1111] mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={country === "ZA" ? "South Africa" : "Zimbabwe"}
                    disabled
                    className="w-full border border-[#ddd] rounded-sm px-3 py-2 text-sm bg-[#F7F8F8] text-[#565959]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0F1111] mb-1">
                    Phone number <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="+27 82 123 4567"
                    className="w-full border border-[#888c8c] rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e77600]"
                  />
                </div>

                {error && activeStep === 1 && (
                  <p className="text-sm text-red-600">{error}</p>
                )}

                <button
                  onClick={handleConfirmAddress}
                  className="bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-sm px-6 py-2 text-sm font-normal text-[#0F1111] cursor-pointer transition-colors"
                >
                  Deliver to this address
                </button>
              </div>
            )}
          </div>

          {/* ── Step 2: Payment method ─────────────────────────────────── */}
          <div className="bg-white rounded border border-[#ddd] overflow-hidden">
            <StepHeader
              step={2}
              activeStep={activeStep}
              title="2  Payment method"
              summary={
                activeStep > 2
                  ? paymentMethod === "card"
                    ? "Card via Yoco"
                    : "EFT / Bank Transfer"
                  : undefined
              }
              onEdit={() => setActiveStep(2)}
            />

            {activeStep === 2 && (
              <div className="p-5 space-y-4">
                <div className="space-y-3">
                  <label
                    className={`flex items-center gap-3 border rounded-sm p-3 cursor-pointer transition-colors ${
                      paymentMethod === "card"
                        ? "border-[#e77600] ring-1 ring-[#e77600] bg-[#fffbf0]"
                        : "border-[#c8c8c8] hover:border-[#007185]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      checked={paymentMethod === "card"}
                      onChange={() => setPaymentMethod("card")}
                      className="accent-[#e77600]"
                    />
                    <div>
                      <p className="text-sm font-bold text-[#0F1111]">
                        Credit / Debit Card
                      </p>
                      <p className="text-xs text-[#565959]">
                        Secured by Yoco — Visa, Mastercard accepted
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-3 border rounded-sm p-3 cursor-pointer transition-colors ${
                      paymentMethod === "eft"
                        ? "border-[#e77600] ring-1 ring-[#e77600] bg-[#fffbf0]"
                        : "border-[#c8c8c8] hover:border-[#007185]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="eft"
                      checked={paymentMethod === "eft"}
                      onChange={() => setPaymentMethod("eft")}
                      className="accent-[#e77600]"
                    />
                    <div>
                      <p className="text-sm font-bold text-[#0F1111]">
                        EFT / Bank Transfer
                      </p>
                      <p className="text-xs text-[#565959]">
                        Manual bank transfer — order held pending payment
                      </p>
                    </div>
                  </label>
                </div>

                <button
                  onClick={handleConfirmPayment}
                  className="bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-sm px-6 py-2 text-sm font-normal text-[#0F1111] cursor-pointer transition-colors"
                >
                  Use this payment method
                </button>
              </div>
            )}
          </div>

          {/* ── Step 3: Review & place order ──────────────────────────── */}
          <div className="bg-white rounded border border-[#ddd] overflow-hidden">
            <StepHeader
              step={3}
              activeStep={activeStep}
              title="3  Review items and shipping"
            />

            {activeStep === 3 && (
              <div className="p-5 space-y-4">
                {/* Item list */}
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div key={item.product._id} className="flex gap-3">
                      <div className="w-16 h-16 relative bg-gray-100 rounded shrink-0">
                        {item.product.images?.[0] && (
                          <Image
                            src={imageUrl(item.product.images[0]).url()}
                            alt={item.product.name || ""}
                            fill
                            className="object-contain p-1"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#0F1111] line-clamp-2">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-[#565959]">
                          Qty: {item.quantity}
                        </p>
                        <p className="text-sm font-bold text-[#0F1111] mt-0.5">
                          {formatPrice(
                            (item.product.price || 0) * item.quantity,
                            currency
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Delivery speed */}
                <div>
                  <p className="text-sm font-bold text-[#0F1111] mb-2">
                    Choose your delivery speed:
                  </p>
                  <div className="space-y-2">
                    {DELIVERY_SPEEDS.map((speed) => (
                      <label
                        key={speed.id}
                        className={`flex items-center gap-3 border rounded-sm p-3 cursor-pointer text-sm transition-colors ${
                          deliverySpeed === speed.id
                            ? "border-[#e77600] ring-1 ring-[#e77600] bg-[#fffbf0]"
                            : "border-[#c8c8c8] hover:border-[#007185]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="delivery"
                          value={speed.id}
                          checked={deliverySpeed === speed.id}
                          onChange={() => setDeliverySpeed(speed.id)}
                          className="accent-[#e77600]"
                        />
                        <span className="flex-1">{speed.label}</span>
                        <span className="font-bold text-[#007600]">
                          {speed.price === 0
                            ? "FREE"
                            : formatPrice(speed.price, currency)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {error && activeStep === 3 && (
                  <p className="text-sm text-red-600">{error}</p>
                )}

                <button
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting}
                  className="w-full bg-[#FFA41C] hover:bg-[#FA8900] border border-[#FF8F00] rounded-full py-3 text-base font-bold text-[#0F1111] cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  id="place-order-button"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing…
                    </>
                  ) : (
                    "Place your order"
                  )}
                </button>
                <p className="text-xs text-center text-[#565959]">
                  By placing your order, you agree to our{" "}
                  <Link href="/welcome" className="text-[#007185] hover:underline">
                    conditions of use
                  </Link>
                  . You will be redirected to Yoco's secure payment gateway.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Order summary sidebar ──────────────────────────────────────── */}
        <div className="lg:w-72 shrink-0">
          <div className="bg-white rounded border border-[#ddd] p-4 sticky top-4 space-y-3">
            <button
              onClick={activeStep === 3 ? handlePlaceOrder : undefined}
              disabled={activeStep !== 3 || isSubmitting}
              className="w-full bg-[#FFA41C] hover:bg-[#FA8900] border border-[#FF8F00] rounded-full py-2 text-sm font-bold text-[#0F1111] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
              Place your order
            </button>
            <p className="text-xs text-[#565959] text-center">
              Complete all steps above to place order
            </p>

            <div className="border-t border-[#ddd] pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-[#565959]">Items:</span>
                <span>{formatPrice(subtotal, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#565959]">Shipping:</span>
                <span>{formatPrice(shipping, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#565959]">VAT (15%):</span>
                <span>{formatPrice(tax, currency)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-[#CC0C39] border-t border-[#ddd] pt-2 mt-2">
                <span>Order total:</span>
                <span>{formatPrice(total, currency)}</span>
              </div>
            </div>

            {/* Item thumbnails */}
            <div className="border-t border-[#ddd] pt-3 space-y-2">
              {items.slice(0, 3).map((item) => (
                <div key={item.product._id} className="flex gap-2">
                  <div className="w-12 h-12 relative bg-gray-100 rounded shrink-0">
                    {item.product.images?.[0] && (
                      <Image
                        src={imageUrl(item.product.images[0]).url()}
                        alt={item.product.name || ""}
                        fill
                        className="object-contain p-1"
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-[#0F1111] line-clamp-2">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-[#565959]">Qty: {item.quantity}</p>
                  </div>
                </div>
              ))}
              {items.length > 3 && (
                <p className="text-xs text-[#565959]">
                  + {items.length - 3} more item{items.length - 3 !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
