"use client";

import { createCheckoutSession } from "@/actions/createCheckoutSession";
import { validateCoupon } from "@/actions/validateCoupon";
import AddToBasketButton from "@/components/AddToBasketButton";
import Loader from "@/components/Loader";
import { imageUrl } from "@/lib/imageUrl";
import useBasketStore from "@/store/store";
import { SignInButton, useAuth, useUser } from "@clerk/nextjs";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

export type Metadata = {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  clerkUserId: string;
  couponCode?: string;
  discountAmount?: number;
  applicableProducts?: string; // JSON string of IDs
};

function BasketPage() {
  const groupedItems = useBasketStore((state) => state.getGroupedItems());
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const [isClient, setClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [applicableProducts, setApplicableProducts] = useState<string[]>([]);

  useEffect(() => {
    setClient(true);
  }, []);

  if (!isClient) {
    return <Loader />;
  }

  if (groupedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-4xl font-bold mb-4">Your basket is empty</h1>
        <p className="text-lg mb-8">
          You have not added any items to your basket yet.
        </p>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => router.push("/")}
        >
          Continue Shopping
        </button>
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
      setCouponCode("");
    } else {
      setCouponError(result.message!);
    }
  };

  const handleCheckout = async () => {
    if (!isSignedIn) return;
    setIsLoading(true);

    try {
      const metadata: Metadata = {
        orderNumber: crypto.randomUUID(),
        customerName: user?.fullName ?? "Unknown",
        customerEmail: user?.emailAddresses[0].emailAddress ?? "Unknown",
        clerkUserId: user!.id,
        couponCode: appliedCoupon,
        discountAmount: discount,
        applicableProducts: JSON.stringify(applicableProducts),
      };

      const checkoutUrl = await createCheckoutSession(groupedItems, metadata);

      if (checkoutUrl) {
        router.push(checkoutUrl);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalPrice = useBasketStore.getState().getTotalPrice();
  
  const calculateDiscount = () => {
    if (discount === 0) return 0;
    
    if (applicableProducts.length === 0) {
      // Global discount
      return (totalPrice * discount) / 100;
    }

    // Specific product discount
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

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-4">Your Basket</h1>
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-grow">
          {groupedItems?.map((item) => (
            <div
              key={item.product._id}
              className="mb-4 p-4 border rounded flex items-center justify-between"
            >
              <div
                className="flex items-center cursor-pointer flex-1 min-w-0"
                onClick={() =>
                  router.push(`/product/${item.product.slug?.current}`)
                }
              >
                <div className="w-20 h-20 mr-4 sm:w-24 sm:h-24 flex-shrink-0">
                  {item.product.image && (
                    <Image
                      src={imageUrl(item.product.image).url()}
                      alt={item.product.name ?? "Product image"}
                      className="w-full h-full object-cover rounded"
                      width={96}
                      height={96}
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold">{item.product.name}</h2>
                  <p className="text-sm sm:text-base">
                    Price: $
                    {((item.product.price ?? 0) * item.quantity).toFixed(2)}
                  </p>
                  {applicableProducts.includes(item.product._id) && (
                    <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mt-1">
                      {discount}% Off ({appliedCoupon})
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center ml-4 flex-shrink-0">
                <AddToBasketButton product={item.product} />
              </div>
            </div>
          ))}
        </div>
        <div className="w-full lg:w-80 lg:sticky lg:top-4 h-fit bg-white p-6 border rounded order-first lg:order-last fixed bottom-0 left-0 lg:left-auto">
          <h3 className="text-xl font-bold mb-4">Order Summary</h3>
          <div className="mt-4 space-y-2">
            <p className="flex justify-between">
              <span>Items:</span>
              <span>
                {groupedItems.reduce((total, item) => total + item.quantity, 0)}
              </span>
            </p>
            <p className="flex justify-between">
              <span>Subtotal:</span>
              <span>${totalPrice.toFixed(2)}</span>
            </p>
            {discount > 0 && (
              <p className="flex justify-between text-green-600">
                <span>Discount ({discount}%{applicableProducts.length > 0 ? " on specific items" : ""}):</span>
                <span>-${discountValue.toFixed(2)}</span>
              </p>
            )}
            <p className="flex justify-between text-2xl font-bold border-t pt-2">
              <span>Total:</span>
              <span>${finalPrice.toFixed(2)}</span>
            </p>
          </div>

          <div className="mt-4">
            <label htmlFor="coupon" className="block text-sm font-medium text-gray-700">
              Coupon Code
            </label>
            <div className="mt-1 flex gap-2">
              <input
                type="text"
                name="coupon"
                id="coupon"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                placeholder="Enter code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded"
              >
                Apply
              </button>
            </div>
            {couponError && <p className="text-red-500 text-sm mt-1">{couponError}</p>}
            {appliedCoupon && (
              <p className="text-green-600 text-sm mt-1">
                Coupon "{appliedCoupon}" applied!
              </p>
            )}
          </div>

          {isSignedIn ? (
            <button
              className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4 disabled:bg-gray-400"
              onClick={handleCheckout}
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "Checkout"}
            </button>
          ) : (
            <SignInButton mode="modal">
              <button className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4">
                Sign in to checkout
              </button>
            </SignInButton>
          )}
        </div>
        <div className="h-64 lg:h-0"></div>
      </div>
    </div>
  );
}

export default BasketPage;
