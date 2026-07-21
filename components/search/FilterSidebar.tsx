"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";

import { Category } from "@/sanity.types";

interface Brand {
  name: string;
  slug?: string;
}

interface FilterSidebarProps {
  brands: Brand[];
  categories: Category[];
  activeCategory: string;
  activeBrands: string[];
  activeMinPrice: string;
  activeMaxPrice: string;
  activeRating: string;
  query: string;
}


const STAR_FILTERS = [4, 3, 2, 1];

function StarRow({ stars }: { stars: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-hidden>
      {[...Array(5)].map((_, i) => (
        <svg
          key={i}
          className="w-3.5 h-3.5"
          viewBox="0 0 24 24"
          fill="#FFA41C"
          fillOpacity={i < stars ? 1 : 0.25}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
      <span className="ml-1 text-sm text-[#007185]">& Up</span>
    </span>
  );
}

export default function FilterSidebar({
  brands,
  categories,
  activeCategory,
  activeBrands,
  activeMinPrice,
  activeMaxPrice,
  activeRating,
  query,
}: FilterSidebarProps) {
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();
  const [minPrice, setMinPrice] = useState(activeMinPrice);
  const [maxPrice, setMaxPrice] = useState(activeMaxPrice);

  const applyParam = (key: string, value: string | null) => {
    if (key === "category" && value) {
        if (pathname === "/best-sellers") {
            const next = new URLSearchParams(params.toString());
            if (value === "all") next.delete("category");
            else next.set("category", value);
            router.push(`/best-sellers?${next.toString()}`);
            return;
        }
        router.push(`/categories/${value}`);
        return;
    }

    const next = new URLSearchParams(params.toString());
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    router.push(`/search?${next.toString()}`);
  };


  const toggleBrand = (brand: string) => {
    const current = activeBrands.includes(brand)
      ? activeBrands.filter((b) => b !== brand)
      : [...activeBrands, brand];
    const next = new URLSearchParams(params.toString());
    if (current.length > 0) {
      next.set("brands", current.join(","));
    } else {
      next.delete("brands");
    }
    router.push(`/search?${next.toString()}`);
  };

  const applyPriceRange = () => {
    const next = new URLSearchParams(params.toString());
    if (minPrice) next.set("minPrice", minPrice); else next.delete("minPrice");
    if (maxPrice) next.set("maxPrice", maxPrice); else next.delete("maxPrice");
    router.push(`/search?${next.toString()}`);
  };

  const currentCategory = categories.find(c => c.slug?.current === activeCategory);

  const parentCategory = currentCategory?.parentCategory as any;

  // Grouping logic: Show sub-categories if one is selected, or show main departments
  const subCategories = activeCategory && activeCategory !== "all"
    ? categories.filter(c => (c.parentCategory as any)?._id === currentCategory?._id)
    : [];
  
  const mainDepartments = categories.filter(c => !c.parentCategory);

  return (
    <aside className="w-full space-y-6 text-sm">
      {/* Departments */}
      <div>
        <h3 className="font-bold text-[#0F1111] mb-1">Department</h3>
        <ul className="space-y-1">
          {/* Current Drill-down */}
          {activeCategory && activeCategory !== "all" && (
            <>
              <li className="mb-1">
                 <button 
                  onClick={() => applyParam("category", parentCategory?.slug?.current || "all")}
                  className="flex items-center gap-1 text-gray-600 hover:text-[#C7511F] font-medium"
                 >
                   <span className="text-[10px]">◀</span>
                   {parentCategory?.name || "Any Department"}
                 </button>
              </li>
              
               <li className="pl-2 font-bold text-[#0F1111] mb-1">
                 {currentCategory?.name}
               </li>

              <div className="pl-4 border-l border-gray-200 ml-1">
                {subCategories.map((cat) => (
                  <li key={cat._id}>
                    <button
                      onClick={() => applyParam("category", cat.slug?.current as string)}
                      className={`hover:text-[#C7511F] transition-colors block py-0.5 ${
                        activeCategory === cat.slug?.current ? "font-bold text-[#0F1111]" : "text-[#007185]"
                      }`}
                    >
                      {cat.name}
                    </button>
                  </li>
                ))}
              </div>

              <div className="my-3 border-t border-gray-100" />
            </>
          )}

          {/* All Main Departments */}
          <div className="space-y-1">
            <h4 className={`text-[11px] uppercase text-gray-400 font-bold tracking-wider mb-2 ${activeCategory && activeCategory !== "all" ? "" : "hidden"}`}>
               Other Departments
            </h4>
            {mainDepartments.map((cat) => (
              <li key={cat._id}>
                <button
                  onClick={() => applyParam("category", cat.slug?.current as string)}
                  className={`hover:text-[#C7511F] transition-colors block py-0.5 ${
                    activeCategory === cat.slug?.current ? "font-bold text-[#0F1111]" : "text-[#007185]"
                  }`}
                >
                  {cat.name}
                </button>
              </li>
            ))}
          </div>
        </ul>
      </div>


      {/* Customer Reviews */}
      <div>
        <h3 className="font-bold text-[#0F1111] mb-2">Customer Review</h3>
        <ul className="space-y-1">
          {STAR_FILTERS.map((stars) => (
            <li key={stars}>
              <button
                onClick={() =>
                  applyParam(
                    "rating",
                    activeRating === String(stars) ? null : String(stars)
                  )
                }
                className={`flex items-center gap-1 hover:text-[#C7511F] transition-colors ${
                  activeRating === String(stars) ? "font-bold text-[#C7511F]" : "text-[#007185]"
                }`}
                aria-label={`${stars} stars and up`}
              >
                <StarRow stars={stars} />
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Brands */}
      {brands.length > 0 && (
        <div>
          <h3 className="font-bold text-[#0F1111] mb-2">Brand</h3>
          <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {brands.map((brand) => (
              <li key={brand.name}>
                <label className="flex items-center gap-2 cursor-pointer hover:text-[#C7511F]">
                  <input
                    type="checkbox"
                    checked={activeBrands.includes(brand.name)}
                    onChange={() => toggleBrand(brand.name)}
                    className="accent-[#e77600] w-4 h-4"
                  />
                  <span className="text-[#0F1111]">{brand.name}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Price range */}
      <div>
        <h3 className="font-bold text-[#0F1111] mb-2">Price (ZAR)</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-20 border border-[#888c8c] rounded-sm px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#e77600]"
            min={0}
          />
          <span className="text-[#565959]">–</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-20 border border-[#888c8c] rounded-sm px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#e77600]"
            min={0}
          />
          <button
            onClick={applyPriceRange}
            className="border border-[#888c8c] rounded-sm px-2 py-1 text-xs hover:bg-[#f7f8f8] transition-colors"
          >
            Go
          </button>
        </div>
      </div>

      {/* Active filters — clear all */}
      {(activeBrands.length > 0 || activeMinPrice || activeMaxPrice || activeRating) && (
        <div>
          <button
            onClick={() => router.push(`/search?query=${encodeURIComponent(query)}`)}
            className="text-xs text-[#007185] hover:text-[#C7511F] hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}
    </aside>
  );
}
