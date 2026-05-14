"use client";

import { HeroBanner } from "@/sanity.types";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import Link from "next/link";
import { useRef } from "react";
import Image from "next/image";
import { imageUrl } from "@/lib/imageUrl";

interface HeroCarouselProps {
  banners: HeroBanner[];
}

export default function HeroCarousel({ banners }: HeroCarouselProps) {
  const autoplayRef = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );

  if (!banners || banners.length === 0) return null;

  return (
    <div className="relative w-full overflow-hidden">
      <Carousel
        plugins={[autoplayRef.current]}
        className="w-full"
        opts={{
          loop: true,
        }}
        onMouseEnter={autoplayRef.current.stop}
        onMouseLeave={autoplayRef.current.reset}
      >
        <CarouselContent>
          {banners.map((banner) => (
            <CarouselItem key={banner._id}>
              <div 
                className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: banner.bgColor || "#E3E6E6" }}
              >
                {/* Optional Background/Product Images can go here. For Amazon style, it's usually a full banner image or a gradient with text + cutouts. */}
                <div className="absolute inset-0 w-full h-full">
                  {banner.productImages?.[0] && (
                     <Image
                        src={imageUrl(banner.productImages[0]).url()}
                        alt={banner.title || "Hero Banner"}
                        fill
                        className="object-cover md:object-contain object-right-bottom"
                        priority
                     />
                  )}
                </div>
                
                <div className="relative z-10 p-6 md:p-12 max-w-4xl w-full text-left bg-gradient-to-r from-black/60 to-transparent sm:from-transparent h-full flex flex-col justify-center">
                  {banner.badge && (
                    <span className="inline-block px-3 py-1 bg-tt-orange text-black font-bold text-xs rounded-full w-max mb-4">
                      {banner.badge}
                    </span>
                  )}
                  <h1 className="text-3xl md:text-5xl font-bold text-white sm:text-black mb-4 drop-shadow-md sm:drop-shadow-none">
                    {banner.title}
                  </h1>
                  <p className="text-lg md:text-xl text-gray-200 sm:text-gray-800 mb-8 max-w-lg drop-shadow-md sm:drop-shadow-none">
                    {banner.subtitle}
                  </p>
                  
                  {banner.ctaHref && banner.ctaLabel && (
                    <Link href={banner.ctaHref}>
                      <button className="bg-tt-orange hover:bg-tt-orange-hover text-black font-bold py-3 px-8 rounded-full shadow-lg transition-transform hover:scale-105">
                        {banner.ctaLabel}
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {/* Navigation Arrows (visible on hover or md+ screens) */}
        <div className="hidden md:block">
          <CarouselPrevious className="left-4 w-12 h-16 rounded-sm bg-white/30 border-0 hover:bg-white/60 text-black shadow-none" />
          <CarouselNext className="right-4 w-12 h-16 rounded-sm bg-white/30 border-0 hover:bg-white/60 text-black shadow-none" />
        </div>
      </Carousel>

      {/* Fade at bottom for transition to content */}
      <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-gray-100 to-transparent pointer-events-none" />
    </div>
  );
}
