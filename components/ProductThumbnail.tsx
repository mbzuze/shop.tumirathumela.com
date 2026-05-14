"use client";

import { imageUrl } from "@/lib/imageUrl";
import { Product } from "@/sanity.types";
import Image from "next/image";
import Link from "next/link";
import useLocationStore from "@/store/locationStore";
import { formatPrice } from "@/lib/utils";

function ProductThumbnail({ product }: { product: Product }) {
    const { currency } = useLocationStore();
    const isOutOfStock = product.stockCount != null && product.stockCount <= 0;

    return (
        <Link
            href={`/product/${product.slug?.current}`}
            className={`group flex flex-col bg-white rounded-lg border border-gray-200 hover:shadow-md shadow-sm transition-all duration-200 overflow-hidden ${isOutOfStock ? 'opacity-50' : ''}`}
        >
            <div className="relative aspect-square w-full h-full overflow-hidden">
                {product.dealBadge && (
                    <div className="absolute top-2 left-2 z-10">
                        {product.dealBadge === "limited-time" && <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded">Limited time deal</span>}
                        {product.dealBadge === "percent-off" && <span className="bg-orange-600 text-white text-[10px] font-bold px-2 py-1 rounded">Sale</span>}
                        {product.dealBadge === "new" && <span className="bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded">New Arrival</span>}
                    </div>
                )}

                {product.images?.[0] && (
                    <Image
                        className="object-contain transition-transform duration-300 group-hover:scale-105"
                        src={imageUrl(product.images[0]).url()}
                        alt={product.name || "Product Image"}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                )}

                {isOutOfStock && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
                        <span className="text-white font-bold text-lg">Out of Stock</span>
                    </div>
                )}
            </div>

            <div className="p-4 flex flex-col flex-grow">
                <h2 className="text-lg font-semibold text-gray-800 line-clamp-2">
                    {product.name}
                </h2>

                <p className="mt-2 text-sm text-gray-600 line-clamp-2 flex-grow">
                    {product.description
                        ?.map((block) =>
                            block._type === "block"
                                ? block.children
                                    ?.map((child) => child.text)
                                    .join("")
                                : ""
                        )
                        .join(" ") || "No description available"}
                </p>
                
                <div className="mt-3 flex items-end gap-2">
                    <p className="text-xl font-bold text-gray-900">
                        {formatPrice(product.price ?? 0, currency)}
                    </p>
                    {product.compareAtPrice && product.compareAtPrice > (product.price ?? 0) && (
                        <p className="text-sm text-gray-500 line-through mb-1">
                            {formatPrice(product.compareAtPrice, currency)}
                        </p>
                    )}
                </div>
            </div>
        </Link>
    )
}
export default ProductThumbnail;