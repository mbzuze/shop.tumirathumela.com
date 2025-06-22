import ProductsView from "@/components/ProductsView";
import { searchProductsByName } from "@/sanity/lib/products/searchProductsByName";

async function SearchPage({
    searchParams,
}: {
    searchParams: { query: string; };
}) {
    const { query } = await searchParams;
    const products = await searchProductsByName(query);

    if  (!products || products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-top min-h-screen bg-gray-100 p-4">
                <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-4xl">
                        <h1 className="text-3xl font-bold mb-6 text-center">
                            No results found for: {query}
                        </h1>
                        <p className="text-gray-600 text-center">
                            Try searching with different keywords or check your spelling.
                        </p>
                </div>
            </div>
        );
    }

    return (
            <div className="flex flex-col items-center justify-top min-h-screen bg-gray-100 p-4">
                <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-4xl">
                        <h1 className="text-3xl font-bold mb-6 text-center">
                            Search results found for: {query}
                        </h1>
                        <div className="text-gray-600 text-center">
                            <ProductsView products={products} categories={[]} />
                        </div>
                </div>
            </div>
    );
}

export default SearchPage;