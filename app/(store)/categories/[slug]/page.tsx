import ProductsView from "@/components/ProductsView";
import { getAllCategories } from "@/sanity/lib/products/getAllCategories";
import { getProductsByCategory } from "@/sanity/lib/products/getProductsByCategory";


async function CategoryPage(
    { params }: { params: { slug: string } }
) {
    const { slug } = await params;
    
    const categories = await getAllCategories();
    const products = await getProductsByCategory(slug);
    

    if (!products || products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-top min-h-screen bg-gray-100 p-4">
                <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-4xl">
                        <h1 className="text-3xl font-bold mb-6 text-center">
                            No products found in this category
                        </h1>
                        <p className="text-gray-600 text-center">
                            Please check back later or try a different category.
                        </p>
                </div>
            </div>
        );
    }
    
  return (
    <div className="flex flex-col items-center justify-top min-h-screen bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-4xl">
            <h1 className="text-3xl font-bold mb-6 text-center">
                {slug
                    .split("-")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}{" "}
                Collection
            </h1>
            <ProductsView products={products} categories={categories} />
        </div>
    </div>
  )
}

export default CategoryPage;