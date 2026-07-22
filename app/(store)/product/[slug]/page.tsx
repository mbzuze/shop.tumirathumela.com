import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductBySlug } from "@/lib/cms-client";
import { PortableText } from "@portabletext/react";
import AddToBasketButton from "@/components/AddToBasketButton";
import ImageGallery from "@/components/product/ImageGallery";
import BuyNowButton from "@/components/product/BuyNowButton";
import ReviewsSection from "@/components/product/ReviewsSection";
import { StarRating } from "@/components/ui/StarRating";
import ProductClientInteractive from "@/components/product/ProductClientInteractive";

// Helper: delivery estimate string
function getDeliveryEstimate(): string {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setHours(14, 0, 0, 0); // 2 PM cutoff
  const hoursLeft = Math.max(0, Math.round((cutoff.getTime() - now.getTime()) / 3_600_000));

  const delivery = new Date(now);
  delivery.setDate(delivery.getDate() + (now > cutoff ? 2 : 1));
  const formatted = delivery.toLocaleDateString("en-ZA", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return now < cutoff
    ? `FREE delivery ${formatted} if ordered within ${hoursLeft} hrs`
    : `FREE delivery ${formatted}`;
}

async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const isOutOfStock =
    product.stockCount != null && product.stockCount <= 0;

  const deliveryEstimate = getDeliveryEstimate();

  const hasDiscount =
    product.compareAtPrice != null &&
    product.compareAtPrice > (product.price ?? 0);

  const discountPct = hasDiscount
    ? Math.round(
        ((product.compareAtPrice! - product.price!) /
          product.compareAtPrice!) *
          100
      )
    : 0;

  // Spec table rows derived from schema fields
  const brand = (product as any).brand as { name?: string; slug?: { current?: string } } | null;
  const category = (product as any).category as { title?: string; name?: string } | null;

  const specs: { label: string; value: string }[] = [
    ...(brand?.name ? [{ label: "Brand", value: brand.name }] : []),
    ...(product.sku ? [{ label: "SKU / Model", value: product.sku }] : []),
    ...(category?.name || category?.title ? [{ label: "Category", value: (category?.name ?? category?.title)! }] : []),
    ...((product as any).tags?.length
      ? [{ label: "Tags", value: (product as any).tags.join(", ") }]
      : []),
  ];

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-4">

        {/* Breadcrumbs */}
        <nav className="text-xs text-[#007185] mb-4 flex items-center gap-1 flex-wrap">
          <Link href="/" className="hover:underline hover:text-[#C7511F]">Home</Link>
          <span className="text-[#565959]">›</span>
          {(category?.name || category?.title) && (
            <>
              <Link
                href={`/search?query=${encodeURIComponent(category?.name ?? category?.title ?? "")}`}
                className="hover:underline hover:text-[#C7511F]"
              >
                {category?.name ?? category?.title}
              </Link>
              <span className="text-[#565959]">›</span>
            </>
          )}
          <span className="text-[#565959] truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* 3-column layout */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Col 1: Image Gallery ─────────────────────────────────────── */}
          <div className="lg:w-[38%] xl:w-[40%] shrink-0">
            <ImageGallery
              images={(product.images ?? []) as any[]}
              productName={product.name ?? "Product"}
            />
          </div>

          {/* ── Col 2: Details & Specs ───────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* Brand link */}
            {brand?.name && (
              <Link
                href={`/search?query=${encodeURIComponent(brand.name)}`}
                className="text-sm text-[#007185] hover:text-[#C7511F] hover:underline"
              >
                Visit the {brand.name} Store
              </Link>
            )}

            {/* Product name */}
            <h1 className="text-xl font-normal text-[#0F1111] mt-1 leading-snug">
              {product.name}
            </h1>

            {/* Star rating row */}
            {product.rating != null && (
              <div className="flex items-center gap-2 mt-2 pb-2 border-b border-[#ddd]">
                <StarRating
                  rating={product.rating}
                  count={product.reviewCount ?? undefined}
                  size="sm"
                />
                <span className="text-xs text-[#565959]">|</span>
                <a
                  href="#reviews-section"
                  className="text-xs text-[#007185] hover:text-[#C7511F] hover:underline"
                >
                  See all reviews
                </a>
              </div>
            )}



            {/* Description */}
            {Array.isArray(product.description) && (
              <div className="prose prose-sm max-w-none mt-4 text-[#0F1111]">
                <PortableText value={product.description} />
              </div>
            )}

            {/* Technical specs table */}
            {specs.length > 0 && (
              <div className="mt-6">
                <h2 className="text-base font-bold text-[#0F1111] mb-2">
                  Technical details
                </h2>
                <table className="w-full text-sm border-collapse">
                  <tbody>
                    {specs.map((spec, i) => (
                      <tr
                        key={spec.label}
                        className={i % 2 === 0 ? "bg-[#F7F8F8]" : "bg-white"}
                      >
                        <td className="py-2 px-4 font-medium text-[#0F1111] w-40">
                          {spec.label}
                        </td>
                        <td className="py-2 px-4 text-[#0F1111]">
                          {spec.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Mobile add-to-basket (below specs) */}
            <div className="mt-6 lg:hidden space-y-2">
              <ProductClientInteractive product={product} />
            </div>
          </div>

          {/* ── Col 3: Floating Buy Box ──────────────────────────────────── */}
          <div className="hidden lg:block w-[280px] xl:w-[300px] shrink-0">
            <div className="border border-[#ddd] rounded p-4 shadow-sm bg-white sticky top-24 space-y-3">
              {/* Seller info */}
              <div className="text-xs text-[#565959] border-t border-[#ddd] pt-3 space-y-0.5">
                <p>
                  <span className="font-medium text-[#0F1111]">Ships from:</span>{" "}
                  TumiraThumela
                </p>
                <p>
                  <span className="font-medium text-[#0F1111]">Sold by:</span>{" "}
                  TumiraThumela Official
                </p>
              </div>

              {/* Interactive Buy Box (Variant selector, price, stock, actions) */}
              <ProductClientInteractive product={product} />

              {/* Deal badge */}
              {product.dealBadge && (
                <div className="bg-[#CC0C39] text-white text-xs font-bold px-2 py-1 rounded w-fit">
                  {product.dealBadge === "limited-time" && "Limited Time Deal"}
                  {product.dealBadge === "percent-off" && `${discountPct}% Off`}
                  {product.dealBadge === "new" && "New Arrival"}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Reviews section */}
        <ReviewsSection rating={product.rating} reviewCount={product.reviewCount} />
      </div>
    </div>
  );
}

export default ProductPage;
