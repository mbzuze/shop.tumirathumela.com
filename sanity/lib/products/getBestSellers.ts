import { defineQuery } from "next-sanity";
import { sanityFetch } from "../live";

export const getBestSellers = async (categorySlug?: string) => {
    const BEST_SELLERS_QUERY = defineQuery(`
        *[
            _type == "product" 
            && (isBestSeller == true || "best-seller" in tags || "Best Seller" in tags)
            ${categorySlug && categorySlug !== 'all' ? '&& references(*[_type == "category" && slug.current == $categorySlug]._id)' : ''}
        ] | order(name asc) {
            ...,
            brand->,
            category->
        }
    `);

    try {
        const products = await sanityFetch({
            query: BEST_SELLERS_QUERY,
            params: {
                categorySlug: categorySlug || "",
            },
        });
        return products.data || [];
    } catch (error) {
        console.error("Error fetching best sellers:", error);
        return [];
    }
};
