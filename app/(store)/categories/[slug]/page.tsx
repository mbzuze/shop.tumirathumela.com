import { Suspense } from "react";
import FilterSidebar from "@/components/search/FilterSidebar";
import ProductThumbnail from "@/components/ProductThumbnail";
import { getAllCategories } from "@/sanity/lib/products/getAllCategories";
import { getProductsByCategory } from "@/sanity/lib/products/getProductsByCategory";

async function CategoryPage(
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    
    const categories = await getAllCategories();
    const products = await getProductsByCategory(slug);
    
    const currentCategory = categories.find(c => c.slug === slug);

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

    if (!products || products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-top min-h-screen bg-gray-100 p-4 pt-12">
                <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-4xl">
                        <h1 className="text-3xl font-bold mb-6 text-center text-gray-900">
                            No products found in {currentCategory?.name || slug}
                        </h1>
                        <p className="text-gray-600 text-center">
                            Please check back later or try a different category.
                        </p>
                </div>
            </div>
        );
    }
    
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
                activeCategory={slug}
                activeBrands={[]}
                activeMinPrice={""}
                activeMaxPrice={""}
                activeRating={""}
                query={""}
              />
            </Suspense>
          </div>

          {/* ── Results area ─────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded p-6 mb-4 shadow-sm">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {currentCategory?.name || slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                </h1>
                <p className="text-gray-600 text-sm">
                    {currentCategory?.description || `Explore our collection of ${currentCategory?.name || slug}.`}
                </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {products.map((product) => (
                    <ProductThumbnail key={product._id} product={product} />
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


export default CategoryPage;