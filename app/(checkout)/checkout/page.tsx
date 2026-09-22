"use client";

import { useEffect, useRef, useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Lock, ChevronDown, ChevronUp, Check } from "lucide-react";
import useBasketStore from "@/store/store";
import useLocationStore from "@/store/locationStore";
import { formatPrice } from "@/lib/utils";
import { imageUrl } from "@/lib/imageUrl";
import type { CmsAddress as CustomerAddress } from "@/lib/cms-client";
import { getMyDefaultAddressAction } from "@/actions/addressActions";
import { ZA_PROVINCES } from "@/lib/geo";
import { SHIPPING_ZAR, vatIncludedCents, type Country, type DeliverySpeed } from "@/lib/shipping";

type Step = 1 | 2 | 3;

const SPEED_LABELS: Record<DeliverySpeed, string> = {
  standard: "Standard Delivery (3–5 business days)",
  express: "Express Delivery (1–2 business days)",
};

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
  const { items, getTotalPrice, appliedCoupon } = useBasketStore();
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
  const [province, setProvince] = useState("");
  // Where the parcel is delivered — distinct from useLocationStore's country,
  // which only governs which currency prices are *displayed* in. Defaults
  // from the visitor's detected location but the shopper can change it.
  const [deliveryCountry, setDeliveryCountry] = useState<Country>(
    useLocationStore.getState().country === "ZW" ? "ZW" : "ZA"
  );
  const [phone, setPhone] = useState("");
  const [usingSaved, setUsingSaved] = useState(false);

  // Step 3 — Delivery speed
  const [deliverySpeed, setDeliverySpeed] = useState<DeliverySpeed>("standard");

  // One idempotency key per distinct checkout attempt. Reused across
  // retries of the same submit (e.g. a double-click that slips past the
  // isSubmitting disable, or the user clicking "Place order" again after a
  // transient error) as long as nothing that defines the order has changed;
  // regenerated the moment it has, so an intentionally different order
  // isn't merged with a stale one.
  const idempotencyRef = useRef<{ signature: string; key: string } | null>(null);

  const speedOptions = (Object.keys(SHIPPING_ZAR[deliveryCountry]) as DeliverySpeed[]).filter(
    (s) => SHIPPING_ZAR[deliveryCountry][s] !== null
  );

  // If switching delivery country makes the selected speed unavailable
  // (express is not offered for ZW), fall back to standard.
  useEffect(() => {
    if (!speedOptions.includes(deliverySpeed)) {
      setDeliverySpeed("standard");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveryCountry]);

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
          setProvince(addr.province || "");
          setDeliveryCountry(addr.country === "ZW" ? "ZW" : "ZA");
          setPhone(addr.phone);
          setUsingSaved(true);
        }
      })
      .finally(() => setLoadingAddress(false));
  }, [isLoaded, user]);

  const subtotal = getTotalPrice();
  // Rate is null only for a combination speedOptions already excludes, but
  // the fallback keeps this a plain number for arithmetic below.
  const shipping = SHIPPING_ZAR[deliveryCountry][deliverySpeed] ?? 0;
  // Listed prices are VAT-inclusive — VAT is never added on top. This is
  // only ever the included component of the total, for display.
  const discountAmount = appliedCoupon?.discountAmount || 0;
  const total = Math.max(0, subtotal - discountAmount) + shipping;
  const vatIncluded = vatIncludedCents(Math.round(total * 100)) / 100;

  const handleConfirmAddress = () => {
    if (!streetAddress || !city || !postalCode || !phone) {
      setError("Please fill in all required address fields.");
      return;
    }
    if (deliveryCountry === "ZA" && !province) {
      setError("Please select a province.");
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
      // Ids, quantities and choices only — the server reprices everything
      // from trusted CMS data rather than any amount computed here. `total`,
      // `subtotal` etc. below are the client's own estimate for display; they
      // are never sent as the amount to charge.
      const orderItems = items.map((item) => ({
        productId: item.product._id,
        quantity: item.quantity,
      }));
      const addressInput = {
        phone,
        streetAddress,
        city,
        province: deliveryCountry === "ZA" ? province : undefined,
        postalCode,
        country: deliveryCountry,
      };
      const couponCode = appliedCoupon?.code || undefined;

      const signature = JSON.stringify({ items: orderItems, address: addressInput, deliverySpeed, couponCode });
      if (idempotencyRef.current?.signature !== signature) {
        idempotencyRef.current = { signature, key: crypto.randomUUID() };
      }

      const payload = {
        items: orderItems,
        address: addressInput,
        deliverySpeed,
        couponCode,
        idempotencyKey: idempotencyRef.current.key,
      };

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error === "CART_STALE") {
          throw new Error(
            "One or more items in your basket are no longer available. Please remove them and try again."
          );
        }
        if (data.error === "OUT_OF_STOCK") {
          throw new Error(
            "One or more items in your basket don't have enough stock available. Please adjust the quantities and try again."
          );
        }
        throw new Error(data.issues?.[0]?.message || data.error || "Failed to create checkout");
      }
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-[#0F1111] mb-1">
                      Country <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={deliveryCountry}
                      onChange={(e) => setDeliveryCountry(e.target.value as Country)}
                      className="w-full border border-[#888c8c] rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e77600] bg-white"
                    >
                      <option value="ZA">South Africa</option>
                      <option value="ZW">Zimbabwe</option>
                    </select>
                  </div>
                  {deliveryCountry === "ZA" && (
                    <div>
                      <label className="block text-sm font-medium text-[#0F1111] mb-1">
                        Province <span className="text-red-600">*</span>
                      </label>
                      <select
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                        required
                        className="w-full border border-[#888c8c] rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e77600] bg-white"
                      >
                        <option value="">Select…</option>
                        {ZA_PROVINCES.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
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
              summary={activeStep > 2 ? "Card via Yoco" : undefined}
              onEdit={() => setActiveStep(2)}
            />

            {activeStep === 2 && (
              <div className="p-5 space-y-4">
                {/* Card via Yoco is the only payment method this store offers —
                    an "EFT / Bank Transfer" option used to sit here but always
                    routed to Yoco regardless, which misrepresented how the
                    order would actually be paid. */}
                <div className="flex items-center gap-3 border border-[#e77600] ring-1 ring-[#e77600] bg-[#fffbf0] rounded-sm p-3">
                  <div>
                    <p className="text-sm font-bold text-[#0F1111]">
                      Credit / Debit Card
                    </p>
                    <p className="text-xs text-[#565959]">
                      Secured by Yoco — Visa, Mastercard accepted
                    </p>
                  </div>
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
                    {speedOptions.map((id) => {
                      const price = SHIPPING_ZAR[deliveryCountry][id]!;
                      return (
                      <label
                        key={id}
                        className={`flex items-center gap-3 border rounded-sm p-3 cursor-pointer text-sm transition-colors ${
                          deliverySpeed === id
                            ? "border-[#e77600] ring-1 ring-[#e77600] bg-[#fffbf0]"
                            : "border-[#c8c8c8] hover:border-[#007185]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="delivery"
                          value={id}
                          checked={deliverySpeed === id}
                          onChange={() => setDeliverySpeed(id)}
                          className="accent-[#e77600]"
                        />
                        <span className="flex-1">{SPEED_LABELS[id]}</span>
                        <span className="font-bold text-[#007600]">
                          {price === 0 ? "FREE" : formatPrice(price, currency)}
                        </span>
                      </label>
                      );
                    })}
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
                <span className="text-[#565959]">VAT (15%, included):</span>
                <span>{formatPrice(vatIncluded, currency)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-[#007600]">
                  <span>Discount ({appliedCoupon?.code}):</span>
                  <span>-{formatPrice(discountAmount, currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-[#CC0C39] border-t border-[#ddd] pt-2 mt-2">
                <span>Order total:</span>
                <span>{formatPrice(total, currency)}</span>
              </div>
            </div>

            {country === "ZW" && (
              <div className="bg-[#EAF7EF] border border-[#007600] rounded-sm p-3 text-xs text-[#007600]">
                <strong>Currency Notice:</strong> Your order will be processed in 
                South African Rand (ZAR). Your bank will convert to USD at their current 
                exchange rate. Estimated USD equivalent: ${(total / 18.5).toFixed(2)}
              </div>
            )}

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
