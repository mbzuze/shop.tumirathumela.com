// import { useState } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import { Product } from "@/types";
import Container from "@/components/ui/container";
import ProductCard from "@/components/ui/product-card";
import NoResults from "@/components/ui/no-results";

async function SearchPage({
    searchParams,
}: {
    searchParams: { query: string; };
}) {

    // const {query} = await searchParams;

    // const [products, setProducts] = useState<Product[]>([]);
    // const [loading, setLoading] = useState(true);
    const loading = false;
    const { query } = await searchParams;

    // const fetchSearchResults = async () => {
    //     try {
    //         setLoading(true);
    //         const response = await fetch(`/api/search?query=${searchQuery}`);
    //         const data = await response.json();
    //         setProducts(data);
    //     } catch (error) {
    //         console.error("Error fetching search results:", error);
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    return (
        <div className="bg-white">
            {/* <Container> */}
            <div className="px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-4">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                        Search Results for: {query}
                    </h1>
                </div>
                {loading ? (
                    <div>Loading...</div>
                ) :
                    // products.length === 0 ? (
                    //     <NoResults />
                    // ) :
                    (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {/* {products.map((product) => (
                            <ProductCard key={product.id} data={product} />
                        ))} */}
                        </div>
                    )}
            </div>
            {/* </Container> */}
        </div>
    );
}

export default SearchPage;