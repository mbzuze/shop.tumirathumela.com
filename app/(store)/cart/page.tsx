"use client";

import { validateCoupon } from "@/actions/validateCoupon";
import { imageUrl } from "@/lib/imageUrl";
import { formatPrice } from "@/lib/utils";
import useBasketStore from "@/store/store";
import useLocationStore from "@/store/locationStore";
import { SignInButton, useAuth, useUser } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Trash2, ShoppingCart, Tag, ChevronRight, Shield, Truck } from "lucide-react";

export type Metadata = {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  clerkUserId: string;
  couponCode?: string;
  discountAmount?: number;
  applicableProducts?: string;
};

function CartPage() {
  const groupedItems = useBasketStore((state) => state.getGroupedItems());
  const { removeItem, addItem, applyCoupon } = useBasketStore();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const { currency } = useLocationStore();

  const [isClient, setClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [applicableProducts, setApplicableProducts] = useState<string[]>([]);

  useEffect(() => { setClient(true); }, []);

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8 text-tt-navy" />
      </div>
    );
  }

  if (groupedItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-8">
        <div className="bg-white rounded-lg shadow p-10 flex flex-col items-center max-w-sm w-full text-center">
          <ShoppingCart className="w-20 h-20 text-gray-300 mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Your basket is empty</h1>
          <p className="text-gray-500 mb-6">Looks like you haven't added anything yet.</p>
          <button
            className="bg-tt-orange hover:bg-tt-orange-hover text-black font-bold py-2.5 px-6 rounded-full transition-colors"
            onClick={() => router.push("/")}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setCouponError("");
    const result = await validateCoupon(couponCode);
    if (result.isValid) {
      setDiscount(result.discountAmount!);
      setAppliedCoupon(result.code!);
      setApplicableProducts(result.applicableProducts || []);

      const tPrice = useBasketStore.getState().getTotalPrice();
      let dValue = 0;
      if (!result.applicableProducts || result.applicableProducts.length === 0) {
        dValue = (tPrice * result.discountAmount!) / 100;
      } else {
        const discountableAmount = groupedItems.reduce((acc, item) => {
          if (result.applicableProducts!.includes(item.product._id)) {
            return acc + (item.product.price ?? 0) * item.quantity;
          }
          return acc;
        }, 0);
        dValue = (discountableAmount * result.discountAmount!) / 100;
      }

      applyCoupon({
        code: result.code!,
        discountPercent: result.discountAmount!,
        discountAmount: dValue,
        applicableProductIds: result.applicableProducts || []
      });

      setCouponCode("");
    } else {
      setCouponError(result.message!);
    }
  };

  const handleCheckout = () => {
    if (!isSignedIn) return;
    router.push("/checkout");
  };

  const totalPrice = useBasketStore.getState().getTotalPrice();

  const calculateDiscount = () => {
    if (discount === 0) return 0;
    if (applicableProducts.length === 0) return (totalPrice * discount) / 100;
    const discountableAmount = groupedItems.reduce((acc, item) => {
      if (applicableProducts.includes(item.product._id)) {
        return acc + (item.product.price ?? 0) * item.quantity;
      }
      return acc;
    }, 0);
    return (discountableAmount * discount) / 100;
  };

  const discountValue = calculateDiscount();
  const finalPrice = Math.max(0, totalPrice - discountValue);
  const totalItems = groupedItems.reduce((t, i) => t + i.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* Page Header */}
        <div className="border-b border-gray-300 pb-3 mb-4">
          <h1 className="text-3xl font-normal text-gray-900">Shopping Basket</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* Left: Cart Items */}
          <div className="flex-1">
            {/* Price header */}
            <div className="hidden lg:flex justify-end pr-4 pb-2">
              <span className="text-sm text-gray-600 font-medium">Price</span>
            </div>

            <div className="bg-white rounded-lg shadow-sm">
              {groupedItems.map((item, idx) => {
                const isDiscounted = applicableProducts.includes(item.product._id);
                const lineTotal = (item.product.price ?? 0) * item.quantity;
                return (
                  <div
                    key={item.product._id}
                    className={`p-5 flex gap-5 ${idx < groupedItems.length - 1 ? "border-b border-gray-200" : ""}`}
                  >
                    {/* Product Image */}
                    <div
                      className="w-28 h-28 flex-shrink-0 cursor-pointer"
                      onClick={() => router.push(`/product/${item.product.slug?.current}`)}
                    >
                      {item.product.images?.[0] ? (
                        <Image
                          src={imageUrl(item.product.images[0]).url()}
                          alt={item.product.name ?? "Product"}
                          className="w-full h-full object-contain"
                          width={112}
                          height={112}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center">
                          <ShoppingCart className="w-8 h-8 text-gray-300" />
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h2
                        className="text-base font-medium text-[#0F1111] hover:text-[#C7511F] cursor-pointer line-clamp-2 mb-1"
                        onClick={() => router.push(`/product/${item.product.slug?.current}`)}
                      >
                        {item.product.name}
                      </h2>

                      <p className="text-green-700 text-sm font-medium mb-1">In Stock</p>

                      {isDiscounted && (
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded mb-2">
                          <Tag className="w-3 h-3" /> {discount}% off with code "{appliedCoupon}"
                        </span>
                      )}

                      {/* Quantity + Actions */}
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center border border-gray-300 rounded bg-gray-50">
                          <button
                            className="px-3 py-1 text-gray-700 hover:bg-gray-200 transition-colors"
                            onClick={() => removeItem(item.product._id)}
                          >
                            –
                          </button>
                          <span className="px-3 py-1 text-sm font-medium border-x border-gray-300 min-w-[2rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            className="px-3 py-1 text-gray-700 hover:bg-gray-200 transition-colors"
                            onClick={() => addItem(item.product)}
                          >
                            +
                          </button>
                        </div>
                        <span className="text-gray-300">|</span>
                        <button
                          className="text-[#007185] hover:text-[#C7511F] text-sm flex items-center gap-1 hover:underline"
                          onClick={() => {
                            // Remove all quantities of this item
                            for (let i = 0; i < item.quantity; i++) {
                              removeItem(item.product._id);
                            }
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                        <span className="text-gray-300 hidden sm:inline">|</span>
                        <Link
                          href={`/product/${item.product.slug?.current}`}
                          className="text-[#007185] hover:text-[#C7511F] text-sm hover:underline hidden sm:inline"
                        >
                          Save for later
                        </Link>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="hidden lg:block flex-shrink-0 text-right">
                      <p className="text-lg font-bold text-[#0F1111]">
                        {formatPrice(lineTotal, currency)}
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatPrice(item.product.price ?? 0, currency)} each
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Subtotal at bottom of items list (Amazon style) */}
              <div className="px-5 py-4 text-right border-t border-gray-100">
                <p className="text-lg">
                  Subtotal ({totalItems} {totalItems === 1 ? "item" : "items"}):{" "}
                  <span className="font-bold text-[#0F1111]">{formatPrice(finalPrice, currency)}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Right: Order Summary Sticky */}
          <div className="w-full lg:w-72 xl:w-80 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-5">
              {/* Free delivery notice */}
              <div className="flex items-start gap-2 text-sm mb-4 pb-4 border-b border-gray-200">
                <Truck className="w-4 h-4 text-green-700 flex-shrink-0 mt-0.5" />
                <p className="text-[#007600]">
                  <span className="font-semibold">FREE Delivery</span> on orders over{" "}
                  {formatPrice(500, currency)}. <span className="text-[#007185] hover:underline cursor-pointer">Details</span>
                </p>
              </div>

              {/* Subtotal */}
              <p className="text-lg mb-3">
                Subtotal ({totalItems} {totalItems === 1 ? "item" : "items"}):{" "}
                <span className="font-bold text-[#0F1111]">{formatPrice(finalPrice, currency)}</span>
              </p>

              {/* Gift option */}
              <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
                <input type="checkbox" id="gift" className="accent-tt-navy" />
                <label htmlFor="gift">This order contains a gift</label>
              </div>

              {/* Checkout button */}
              {isSignedIn ? (
                <button
                  className="w-full bg-tt-orange hover:bg-tt-orange-hover text-black font-bold py-2.5 px-6 rounded-full transition-colors mb-3 disabled:opacity-50"
                  onClick={handleCheckout}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin w-4 h-4" /> Processing...
                    </span>
                  ) : (
                    "Proceed to Checkout"
                  )}
                </button>
              ) : (
                <SignInButton mode="modal">
                  <button className="w-full bg-tt-orange hover:bg-tt-orange-hover text-black font-bold py-2.5 px-6 rounded-full transition-colors mb-3">
                    Sign in to Checkout
                  </button>
                </SignInButton>
              )}

              {/* Security note */}
              <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-4">
                <Shield className="w-3.5 h-3.5" />
                <span>Secure checkout with Yoco</span>
              </div>

              {/* Coupon */}
              <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Promotional code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-tt-navy"
                    placeholder="Enter code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 text-sm font-medium py-1.5 px-3 rounded transition-colors"
                  >
                    Apply
                  </button>
                </div>
                {couponError && <p className="text-red-500 text-xs mt-1">{couponError}</p>}
                {appliedCoupon && (
                  <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                    <Tag className="w-3 h-3" /> "{appliedCoupon}" applied ({discount}% off
                    {applicableProducts.length > 0 ? " on selected items" : ""})
                  </p>
                )}
              </div>

              {/* Discount breakdown */}
              {discountValue > 0 && (
                <div className="border-t border-gray-200 pt-3 mt-3 space-y-1 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Items:</span>
                    <span>{formatPrice(totalPrice, currency)}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-{formatPrice(discountValue, currency)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-[#0F1111] pt-1 border-t">
                    <span>Order Total:</span>
                    <span>{formatPrice(finalPrice, currency)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartPage;
