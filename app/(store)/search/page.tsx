import { Suspense } from "react";
import { searchProductsByName } from "@/lib/cms-client";
import ProductThumbnail from "@/components/ProductThumbnail";
import FilterSidebar from "@/components/search/FilterSidebar";
import SortSelect from "@/components/search/SortSelect";
import { Product } from "@/lib/cms-types";

// Client wrappers are needed for hooks in SortSelect / FilterSidebar,
// but this page itself is a server component for SSR performance.

import { getAllCategories } from "@/lib/cms-client";

interface SearchPageProps {
  searchParams: Promise<{
    query?: string;
    sort?: string;
    brands?: string;
    category?: string;
    tag?: string;
    minPrice?: string;

    maxPrice?: string;
    rating?: string;
  }>;
}


function sortProducts(products: Product[], sort: string): Product[] {
  switch (sort) {
    case "price_asc":
      return [...products].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    case "price_desc":
      return [...products].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    case "rating":
      return [...products].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    case "newest":
      // No created-at in query, keep original order as fallback
      return products;
    default:
      // featured — keep original relevance order
      return products;
  }
}

async function SearchPage({ searchParams }: SearchPageProps) {
  const {
    query = "",
    sort = "featured",
    brands: brandsParam = "",
    category: categorySlug = "",
    tag = "",
    minPrice = "",
    maxPrice = "",
    rating = "",
  } = await searchParams;

  const allCategories = await getAllCategories();
  const activeBrands = brandsParam ? brandsParam.split(",").filter(Boolean) : [];

  // Fetch results
  let products: Product[] = await searchProductsByName(query, categorySlug, tag) as Product[];


  if (activeBrands.length > 0) {
    products = products.filter((p) =>
      activeBrands.includes((p as any).brand?.name ?? "")
    );
  }

  if (minPrice) {
    products = products.filter((p) => (p.price ?? 0) >= Number(minPrice));
  }
  if (maxPrice) {
    products = products.filter((p) => (p.price ?? 0) <= Number(maxPrice));
  }
  if (rating) {
    products = products.filter((p) => (p.rating ?? 0) >= Number(rating));
  }

  // Sort
  products = sortProducts(products, sort);

  // Extract unique brands from unfiltered results (for sidebar)
  const allProducts: Product[] = await searchProductsByName(query) as Product[];
  const brandSet = new Map<string, string>();
  allProducts.forEach((p) => {
    const b = (p as any).brand;
    if (b?.name) brandSet.set(b.name, b.slug?.current ?? b.name);
  });
  const brands = Array.from(brandSet.entries()).map(([name, slug]) => ({
    name,
    slug,
  }));

  const totalCount = products.length;

  return (
    <div className="min-h-screen bg-[#EAEDED]">
      <div className="max-w-7xl mx-auto px-4 py-4">

        {/* Results heading */}
        <div className="mb-2">
          {query && (
            <p className="text-sm text-[#565959]">
              1–{Math.min(totalCount, 48)} of{" "}
              <span className="font-bold text-[#0F1111]">{totalCount} results</span>{" "}
              for{" "}
              <span className="text-[#C7511F] font-bold">&ldquo;{query}&rdquo;</span>
            </p>
          )}
        </div>

        <div className="flex gap-4 items-start">

          {/* ── Left Filter Sidebar ───────────────────────────────────── */}
          <div className="hidden md:block w-56 shrink-0 bg-white rounded p-4 shadow-sm">
            <Suspense fallback={<div className="animate-pulse h-64 bg-gray-100 rounded" />}>
              <FilterSidebar
                brands={brands}
                categories={allCategories as any}
                activeCategory={categorySlug}
                activeBrands={activeBrands}
                activeMinPrice={minPrice}
                activeMaxPrice={maxPrice}
                activeRating={rating}
                query={query}
              />
            </Suspense>

          </div>

          {/* ── Results area ─────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* Top control bar */}
            <div className="bg-white rounded px-4 py-2 mb-3 flex items-center justify-between shadow-sm flex-wrap gap-2">
              <p className="text-sm text-[#565959]">
                Showing {totalCount} result{totalCount !== 1 ? "s" : ""}
                {query ? ` for "${query}"` : ""}
              </p>
              <Suspense fallback={null}>
                <SortSelect current={sort} />
              </Suspense>
            </div>

            {products.length === 0 ? (
              <div className="bg-white rounded p-8 text-center shadow-sm">
                <h1 className="text-2xl font-bold text-[#0F1111] mb-2">
                  No results for &ldquo;{query}&rdquo;
                </h1>
                <p className="text-sm text-[#565959]">
                  Try checking your spelling or use more general terms.
                </p>
              </div>
            ) : (
              <>
                <h1 className="sr-only">
                  {totalCount} search results for &ldquo;{query}&rdquo;
                </h1>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {products.map((product) => (
                    <ProductThumbnail key={product._id} product={product} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchPage;