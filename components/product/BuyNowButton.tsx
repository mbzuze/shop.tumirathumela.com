"use client";

import { useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import useBasketStore from "@/store/store";
import useLocationStore from "@/store/locationStore";
import { Product } from "@/lib/cms-types";
import { Loader2 } from "lucide-react";

interface BuyNowButtonProps {
  product: Product;
  disabled?: boolean;
}

export default function BuyNowButton({ product, disabled }: BuyNowButtonProps) {
  const { user, isLoaded } = useUser();
  const { redirectToSignIn } = useClerk();
  const router = useRouter();
  const { addItem } = useBasketStore();
  const { currency } = useLocationStore();
  const [loading, setLoading] = useState(false);

  const handleBuyNow = async () => {
    // Auth gate — no purchases without sign-in
    if (isLoaded && !user) {
      redirectToSignIn({ redirectUrl: window.location.href });
      return;
    }

    if (!product.price) return;

    setLoading(true);
    try {
      // Add item to basket then redirect to checkout
      addItem(product);
      router.push("/checkout");
    } catch (err) {
      console.error("Buy now failed:", err);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleBuyNow}
      disabled={disabled || loading || !isLoaded}
      className="w-full bg-[#FFA41C] hover:bg-[#FA8900] border border-[#FF8F00] rounded-full py-2 text-sm font-normal text-[#0F1111] cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      id="buy-now-button"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Processing...</span>
        </>
      ) : (
        "Buy Now"
      )}
    </button>
  );
}
