"use client";

import { Category } from "@/lib/cms-types";
import useLocationStore from "@/store/locationStore";
import Link from "next/link";
import Image from "next/image";
import { imageUrl } from "@/lib/imageUrl";

interface PromoRowProps {
  categories: Category[];
}

export default function PromoRow({ categories }: PromoRowProps) {
  const { country, currency } = useLocationStore();

  // Find matching categories dynamically
  const findCategory = (keywords: string[]) => {
    return categories.find((cat) =>
      keywords.some((kw) => cat.name?.toLowerCase().includes(kw))
    );
  };

  const tvCategory = findCategory(["tv", "television", "entertainment", "electronics"]);
  const vitaminsCategory = findCategory(["vitamin", "supplement", "health", "care"]);
  const booksCategory = findCategory(["book", "read"]);

  return (
    <div className="max-w-[1500px] mx-auto w-full px-4 md:px-8 my-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        
        {/* Card 1: TV & Entertainment */}
        <div className="bg-white p-4 shadow-sm flex flex-col h-[380px]">
          <h3 className="text-lg font-bold text-gray-900 mb-3">TV & Home Entertainment</h3>
          <div className="relative flex-grow bg-gray-50 mb-3 rounded overflow-hidden group">
            {tvCategory?.image ? (
              <Image
                src={imageUrl(tvCategory.image).url()}
                alt="TV & Entertainment"
                fill
                className="object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 font-bold">
                📺 TV & Audio
              </div>
            )}
          </div>
          <Link 
            href={tvCategory?.slug?.current ? `/categories/${tvCategory.slug.current}` : "/search?query=TV"} 
            className="text-sm text-blue-600 hover:text-tt-orange hover:underline"
          >
            Explore Entertainment
          </Link>
        </div>

        {/* Card 2: Vitamins & Supplements */}
        <div className="bg-white p-4 shadow-sm flex flex-col h-[380px]">
          <h3 className="text-lg font-bold text-gray-900 mb-3">Vitamins & Supplements</h3>
          <div className="relative flex-grow bg-gray-50 mb-3 rounded overflow-hidden group">
            {vitaminsCategory?.image ? (
              <Image
                src={imageUrl(vitaminsCategory.image).url()}
                alt="Vitamins & Supplements"
                fill
                className="object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 font-bold">
                💊 Health & Wellness
              </div>
            )}
          </div>
          <Link 
            href={vitaminsCategory?.slug?.current ? `/categories/${vitaminsCategory.slug.current}` : "/search?query=Vitamins"} 
            className="text-sm text-blue-600 hover:text-tt-orange hover:underline"
          >
            Shop Health Essentials
          </Link>
        </div>

        {/* Card 3: Books under Budget */}
        <div className="bg-white p-4 shadow-sm flex flex-col h-[380px]">
          <h3 className="text-lg font-bold text-gray-900 mb-3">
            {country === "ZW" ? "Books under USD 15" : "Books under R250"}
          </h3>
          <div className="relative flex-grow bg-gray-50 mb-3 rounded overflow-hidden group">
            {booksCategory?.image ? (
              <Image
                src={imageUrl(booksCategory.image).url()}
                alt="Books"
                fill
                className="object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 font-bold">
                📚 Books & Literature
              </div>
            )}
          </div>
          <Link 
            href="/search?query=Books" 
            className="text-sm text-blue-600 hover:text-tt-orange hover:underline"
          >
            See all books
          </Link>
        </div>

        {/* Card 4: Shop Mzansi / Shop Zim (Locale-aware) */}
        <div className="bg-white p-4 shadow-sm flex flex-col h-[380px] border-t-4 border-tt-orange">
          <h3 className="text-lg font-bold text-gray-900 mb-3">
            {country === "ZW" ? "Shop Zim Favorites" : "Shop Mzansi Local"}
          </h3>
          <div className="relative flex-grow bg-gray-50 mb-3 rounded overflow-hidden group">
            <div className="absolute inset-0 bg-tt-navy-light flex flex-col items-center justify-center p-6 text-center text-white">
              <span className="text-5xl mb-4">{country === "ZW" ? "🇿🇼" : "🇿🇦"}</span>
              <p className="font-bold text-lg mb-1">
                {country === "ZW" ? "Zimbabwe Special" : "South Africa Local"}
              </p>
              <p className="text-xs text-gray-300">
                Top products curated specifically for delivery in your area
              </p>
            </div>
          </div>
          <Link 
            href={`/search?query=${country === "ZW" ? "Zimbabwe" : "Mzansi"}`} 
            className="text-sm text-blue-600 hover:text-tt-orange hover:underline"
          >
            View Local Curations
          </Link>
        </div>

      </div>
    </div>
  );
}
