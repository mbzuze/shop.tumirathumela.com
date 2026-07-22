import ProductThumbnail from "@/components/ProductThumbnail";
import { getDeals } from "@/lib/cms-client";

export const metadata = {
  title: "Today's Deals — TumiraThumela",
  description: "Limited-time deals and markdowns across TumiraThumela's full catalog.",
};

async function DealsPage() {
  const products = await getDeals({ pageSize: 96 });

  return (
    <div className="min-h-screen bg-[#EAEDED]">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="bg-white rounded p-6 mb-4 shadow-sm border-b-4 border-tt-orange">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Today&apos;s Deals
          </h1>
          <p className="text-gray-600 text-sm">
            {products.length > 0
              ? `${products.length} products marked down right now. Deals refresh regularly — check back often.`
              : "New deals are added regularly — check back soon."}
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
            <h2 className="text-xl font-bold text-gray-900 mb-2">No active deals right now</h2>
            <p className="text-gray-600">
              Check out our{" "}
              <a href="/best-sellers" className="text-[#007185] hover:underline">
                Best Sellers
              </a>{" "}
              in the meantime.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default DealsPage;
