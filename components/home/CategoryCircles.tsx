"use client";

import { Category } from "@/lib/cms-types";
import Image from "next/image";
import Link from "next/link";
import { imageUrl } from "@/lib/imageUrl";

interface CategoryCirclesProps {
  categories: Category[];
}

export default function CategoryCircles({ categories }: CategoryCirclesProps) {
  if (!categories || categories.length === 0) return null;

  return (
    <div className="bg-white py-8 px-4 md:px-8 max-w-[1500px] mx-auto w-full my-6 rounded-sm shadow-sm overflow-hidden">
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Shop by Category</h2>
      
      {/* Horizontal scrolling container */}
      <div className="flex items-center space-x-6 sm:space-x-8 overflow-x-auto pb-4 no-scrollbar scroll-smooth">
        {categories.map((category) => (
          <Link 
            key={category._id} 
            href={`/categories/${category.slug?.current || ""}`}
            className="flex flex-col items-center flex-shrink-0 group cursor-pointer"
          >
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border border-gray-200 bg-gray-50 flex-shrink-0 group-hover:border-tt-orange group-hover:shadow-md transition-all">
              {category.image ? (
                <Image
                  src={imageUrl(category.image).url()}
                  alt={category.name || "Category"}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-lg bg-gray-100">
                  {category.name?.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            
            <span className="text-xs sm:text-sm font-medium text-gray-700 mt-3 group-hover:text-tt-orange group-hover:underline text-center max-w-[100px] sm:max-w-[120px] line-clamp-2">
              {category.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
