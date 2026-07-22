"use client";

import { HomepageSection } from "@/lib/cms-types";
import Image from "next/image";
import Link from "next/link";
import { imageUrl } from "@/lib/imageUrl";

interface ShopCardProps {
  section: HomepageSection;
}

export default function ShopCard({ section }: ShopCardProps) {
  const { variant, title, items, heroImage, cta, promoCode, promoDiscount, promoSubtext } = section;

  // Render 2x2 Grid Variant
  if (variant === "grid") {
    return (
      <div className="bg-white p-4 z-10 relative shadow-sm flex flex-col h-full">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
        <div className="grid grid-cols-2 gap-4 flex-grow mb-4">
          {items?.slice(0, 4).map((item, idx) => (
            <Link key={idx} href={item.href || "#"} className="flex flex-col group">
              <div className="relative w-full aspect-square bg-gray-50 mb-2">
                {item.image && (
                  <Image
                    src={imageUrl(item.image).url()}
                    alt={item.label || "Category"}
                    fill
                    className="object-cover group-hover:opacity-90 transition-opacity"
                  />
                )}
              </div>
              <span className="text-xs text-gray-800 line-clamp-1">{item.label}</span>
            </Link>
          ))}
        </div>
        {cta?.href && (
          <Link href={cta.href} className="text-sm text-blue-600 hover:text-tt-orange hover:underline mt-auto">
            {cta.label || "See more"}
          </Link>
        )}
      </div>
    );
  }

  // Render Single Hero Variant
  if (variant === "hero") {
    return (
      <div className="bg-white p-4 z-10 relative shadow-sm flex flex-col h-full">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
        <Link href={cta?.href || "#"} className="flex-grow mb-4 relative w-full group">
          {heroImage && (
            <div className="relative w-full h-[250px] bg-gray-50">
              <Image
                src={imageUrl(heroImage).url()}
                alt={title || "Featured"}
                fill
                className="object-cover group-hover:opacity-90 transition-opacity"
              />
            </div>
          )}
        </Link>
        {cta?.href && (
          <Link href={cta.href} className="text-sm text-blue-600 hover:text-tt-orange hover:underline mt-auto">
            {cta.label || "Shop now"}
          </Link>
        )}
      </div>
    );
  }

  // Render Promo Variant
  if (variant === "promo") {
    return (
      <div className="bg-white p-4 z-10 relative shadow-sm flex flex-col h-full items-center text-center justify-center border-t-4 border-tt-orange">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        {promoDiscount && (
          <div className="text-4xl font-black text-tt-orange my-4">
            {promoDiscount}% OFF
          </div>
        )}
        <p className="text-gray-600 mb-4 max-w-xs">{promoSubtext}</p>
        
        {promoCode && (
          <div className="bg-gray-100 border border-dashed border-gray-400 px-4 py-2 font-mono text-lg font-bold tracking-widest text-gray-800 mb-6 w-full">
            {promoCode}
          </div>
        )}
        
        {cta?.href && (
          <Link href={cta.href} className="w-full mt-auto">
             <button className="w-full bg-tt-navy hover:bg-[#232F3E] text-white py-2 rounded-full font-bold transition-colors">
               {cta.label || "Claim Offer"}
             </button>
          </Link>
        )}
      </div>
    );
  }

  // Fallback (e.g. auth variant for signed out users)
  return (
    <div className="bg-white p-4 z-10 relative shadow-sm flex flex-col h-full items-center justify-center text-center">
      <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
      {cta?.href && (
        <Link href={cta.href} className="w-full mt-4">
           <button className="w-full bg-tt-orange hover:bg-tt-orange-hover text-black py-2 rounded-md font-medium transition-colors shadow-sm">
             {cta.label || "Sign in securely"}
           </button>
        </Link>
      )}
    </div>
  );
}
