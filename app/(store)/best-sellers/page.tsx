import { Suspense } from "react";
import FilterSidebar from "@/components/search/FilterSidebar";
import ProductThumbnail from "@/components/ProductThumbnail";
import { getAllCategories } from "@/lib/cms-client";
import { getBestSellers } from "@/lib/cms-client";
import { Product } from "@/lib/cms-types";

interface BestSellersPageProps {
  searchParams: Promise<{
    category?: string;
  }>;
}

async function BestSellersPage({ searchParams }: BestSellersPageProps) {
    const { category: categorySlug = "" } = await searchParams;
    
    const categories = await getAllCategories();
    const products = await getBestSellers(categorySlug);
    
    const currentCategory = categorySlug ? categories.find(c => c.slug?.current === categorySlug) : null;

    // Extract unique brands for the sidebar
    const brandSet = new Map<string, string>();
    products.forEach((p) => {
      const b = (p as any).brand;
      if (b?.name) brandSet.set(b.name, b.slug?.current ?? b.name);
    });
    const brands = Array.from(brandSet.entries()).map(([name, slug]) => ({
      name,
      slug,
    }));

  return (
    <div className="min-h-screen bg-[#EAEDED]">
      <div className="max-w-7xl mx-auto px-4 py-4">
        
        <div className="flex gap-4 items-start">
          {/* ── Left Filter Sidebar ───────────────────────────────────── */}
          <div className="hidden md:block w-56 shrink-0 bg-white rounded p-4 shadow-sm">
            <Suspense fallback={<div className="animate-pulse h-64 bg-gray-100 rounded" />}>
              <FilterSidebar
                brands={brands}
                categories={categories as any}
                activeCategory={categorySlug}
                activeBrands={[]}
                activeMinPrice={""}
                activeMaxPrice={""}
                activeRating={""}
                query={""}
                // We'll need to update FilterSidebar to support staying on /best-sellers
              />
            </Suspense>
          </div>

          {/* ── Results area ─────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded p-6 mb-4 shadow-sm border-b-4 border-tt-orange">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    TumiraThumela Best Sellers
                </h1>
                <p className="text-gray-600 text-sm">
                    Our most popular products based on sales. Updated frequently.
                    {currentCategory && <span className="font-bold ml-1">Showing {currentCategory.name}</span>}
                </p>
            </div>

            {products.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {products.map((product) => (
                        <ProductThumbnail key={product._id} product={product} />
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded p-12 shadow-sm text-center">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">No Best Sellers found</h2>
                    <p className="text-gray-600">
                        We couldn't find any best sellers in this category at the moment.
                    </p>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BestSellersPage;
