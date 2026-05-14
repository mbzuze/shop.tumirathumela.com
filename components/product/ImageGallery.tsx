"use client";

import { useState } from "react";
import Image from "next/image";
import { imageUrl } from "@/lib/imageUrl";

interface SanityImage {
  _key?: string;
  asset?: {
    _ref: string;
    _type: string;
  };
}

interface ImageGalleryProps {
  images: SanityImage[];
  productName: string;
}

export default function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  const validImages = images.filter((img) => img?.asset?._ref);

  if (validImages.length === 0) {
    return (
      <div className="flex items-center justify-center w-full aspect-square bg-gray-100 rounded text-gray-400 text-sm">
        No image available
      </div>
    );
  }

  const activeImage = validImages[activeIndex];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  return (
    <div className="flex gap-3">
      {/* Thumbnail strip */}
      {validImages.length > 1 && (
        <div className="flex flex-col gap-2 w-16 shrink-0">
          {validImages.map((img, i) => (
            <button
              key={img._key || i}
              onClick={() => setActiveIndex(i)}
              onMouseEnter={() => setActiveIndex(i)}
              className={`relative w-16 h-16 border-2 rounded overflow-hidden transition-all ${
                activeIndex === i
                  ? "border-[#e77600]"
                  : "border-[#ddd] hover:border-[#007185]"
              }`}
            >
              <Image
                src={imageUrl(img).width(64).height(64).url()}
                alt={`${productName} thumbnail ${i + 1}`}
                fill
                className="object-contain p-1"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main image with zoom */}
      <div
        className="relative flex-1 aspect-square overflow-hidden rounded border border-[#ddd] cursor-zoom-in"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
      >
        <Image
          src={imageUrl(activeImage).width(600).height(600).url()}
          alt={`${productName} — image ${activeIndex + 1}`}
          fill
          priority
          className={`object-contain transition-transform duration-200 ${
            isZoomed ? "scale-150" : "scale-100"
          }`}
          style={
            isZoomed
              ? {
                  transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}
