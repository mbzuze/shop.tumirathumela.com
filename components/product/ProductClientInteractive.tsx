"use client";

import { useState } from "react";
import Image from "next/image";
import { imageUrl } from "@/lib/imageUrl";
import AddToBasketButton from "@/components/AddToBasketButton";
import BuyNowButton from "@/components/product/BuyNowButton";
import useLocationStore from "@/store/locationStore";
import { formatPrice } from "@/lib/utils";

export default function ProductClientInteractive({ product }: { product: any }) {
  const { currency } = useLocationStore();
  const [selectedVariant, setSelectedVariant] = useState<any>(
    product.variants?.[0] || null
  );

  const price = selectedVariant?.price ?? product.price ?? 0;
  const compareAtPrice = product.compareAtPrice;
  const sku = selectedVariant?.sku ?? product.sku;
  const stockCount = selectedVariant?.stockCount ?? product.stockCount;
  const isOutOfStock = stockCount != null && stockCount <= 0;

  const hasDiscount = compareAtPrice != null && compareAtPrice > price;
  const discountPct = hasDiscount
    ? Math.round(((compareAtPrice! - price) / compareAtPrice!) * 100)
    : 0;

  const activeProduct = selectedVariant
    ? {
        ...product,
        name: `${product.name} (${selectedVariant.title})`,
        price,
        sku,
      }
    : product;

  return (
    <div className="space-y-4">
      {/* Variant Selector */}
      {product.variants && product.variants.length > 0 && (
        <div className="border-t border-b border-gray-200 py-3 my-4">
          <label className="block text-sm font-bold text-[#0F1111] mb-2">
            Variant: <span className="font-normal text-[#007185]">{selectedVariant?.title || "Default"}</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((variant: any, idx: number) => (
              <button
                key={idx}
                onClick={() => setSelectedVariant(variant)}
                className={`flex items-center gap-2 border rounded p-2 text-xs font-medium cursor-pointer transition-colors ${
                  selectedVariant?.sku === variant.sku
                    ? "border-[#e77600] bg-[#fffbf0] ring-1 ring-[#e77600]"
                    : "border-gray-300 hover:border-gray-400 bg-white"
                }`}
              >
                {variant.images?.[0] && (
                  <div className="w-8 h-8 relative bg-gray-100 rounded overflow-hidden shrink-0">
                    <Image
                      src={imageUrl(variant.images[0]).url()}
                      alt={variant.title || "Variant"}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="text-left">
                  <p className="font-bold text-[#0F1111]">{variant.title}</p>
                  <p className="text-[#565959]">{formatPrice(variant.price ?? 0, currency)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Price block */}
      <div>
        {hasDiscount && (
          <p className="text-sm text-[#CC0C39] font-bold">-{discountPct}% off</p>
        )}
        <p className="text-2xl font-normal text-[#0F1111]">
          {formatPrice(price, currency)}
        </p>
        {hasDiscount && (
          <p className="text-xs text-[#565959] mt-0.5">
            Was: <span className="line-through">{formatPrice(compareAtPrice!, currency)}</span>
          </p>
        )}
      </div>

      {/* Stock status */}
      <div className="text-sm">
        {isOutOfStock ? (
          <p className="text-red-600 font-bold">Currently unavailable</p>
        ) : (
          <p className="text-[#007600] font-bold">In Stock ({stockCount} available)</p>
        )}
      </div>

      {/* Actions */}
      {!isOutOfStock && (
        <div className="space-y-2 pt-1">
          <div className="[&>div]:w-full [&_button]:w-full [&_button]:rounded-full [&_button]:py-2 [&_button]:text-sm [&_button]:bg-[#FFD814] [&_button:hover]:bg-[#F7CA00] [&_button]:border [&_button]:border-[#FCD200] [&_button]:text-[#0F1111] [&_button]:transition-colors">
            <AddToBasketButton product={activeProduct} />
          </div>
          <BuyNowButton product={activeProduct} />
        </div>
      )}
    </div>
  );
}
