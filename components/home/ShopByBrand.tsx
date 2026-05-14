"use client";

import { Brand } from "@/sanity.types";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Image from "next/image";
import Link from "next/link";
import { imageUrl } from "@/lib/imageUrl";

interface ShopByBrandProps {
  brands: Brand[];
}

export default function ShopByBrand({ brands }: ShopByBrandProps) {
  if (!brands || brands.length === 0) return null;

  return (
    <div className="bg-white py-8 px-4 md:px-8 max-w-[1500px] mx-auto w-full my-6 rounded-sm shadow-sm">
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Shop by Brand</h2>
      
      <Carousel
        opts={{
          align: "start",
          slidesToScroll: 2,
        }}
        className="w-full relative"
      >
        <CarouselContent className="-ml-4">
          {brands.map((brand) => (
            <CarouselItem key={brand._id} className="pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/6">
              <Link href={`/search?query=${brand.name || ""}`}>
                <div className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md transition-all h-[140px] group relative overflow-hidden">
                  {brand.logo ? (
                    <div className="relative w-full h-[60px] mb-2">
                      <Image
                        src={imageUrl(brand.logo).url()}
                        alt={brand.name || "Brand logo"}
                        fill
                        className="object-contain p-1 group-hover:scale-105 transition-transform"
                      />
                    </div>
                  ) : (
                    <span className="font-bold text-lg text-gray-600 mb-2">{brand.name}</span>
                  )}
                  
                  <span className="text-sm font-semibold text-gray-800 text-center line-clamp-1">{brand.name}</span>
                  
                  {brand.isAuthorisedReseller && (
                    <span className="absolute top-1 left-1 bg-green-100 text-green-800 text-[10px] font-bold px-1.5 py-0.5 rounded scale-90 origin-top-left">
                      Official
                    </span>
                  )}
                </div>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black shadow-md border border-gray-300 w-10 h-10" />
        <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black shadow-md border border-gray-300 w-10 h-10" />
      </Carousel>
    </div>
  );
}
