import { defineQuery } from "next-sanity";
import { sanityFetch } from "../live";

export const searchProductsByName = async (searchParam: string, categorySlug?: string, tag?: string) => {
    const SEARCH_PRODUCTS_BY_NAME_QUERY = defineQuery(`
    *[
        _type == "product"
        && ($searchParam == "*" || name match $searchParam || description match $searchParam)
        ${categorySlug && categorySlug !== 'all' ? '&& references(*[_type == "category" && slug.current == $categorySlug]._id)' : ''}

        ${tag === 'best-seller' ? '&& (isBestSeller == true || "best-seller" in tags || "Best Seller" in tags)' : ''}
        ${tag === 'new-arrival' ? '&& (dealBadge == "new" || "new-arrival" in tags || "New Arrival" in tags)' : ''}
        ${tag && tag !== 'best-seller' && tag !== 'new-arrival' ? '&& ($tag in tags)' : ''}
    ] | order(name asc) {
        ...,
        brand->,
        category->
    }
    `);
    
    try {
        const products = await sanityFetch({
            query: SEARCH_PRODUCTS_BY_NAME_QUERY,
            params: {
                searchParam: searchParam ? `*${searchParam}*` : "*",
                categorySlug: categorySlug || "",
                tag: tag || "",
            },
        });
        return products.data || [];
    } catch (error) {
        console.error("Error fetching products by name:", error);
        return [];
    }
};