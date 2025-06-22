import { defineQuery } from "next-sanity";
import { sanityFetch } from "../live";

export const searchProductsByName = async (searchParam: string) => {
    const SEARCH_PRODUCTS_BY_NAME_QUERY = defineQuery(`
    *[
        _type == "product"
        && name match $searchParam
    ] | order(name asc)
    `);
    
    try {
        const products = await sanityFetch({
            query: SEARCH_PRODUCTS_BY_NAME_QUERY,
            params: {
                searchParam: `*${searchParam}*`,
            },
        });
        return products.data || [];
    } catch (error) {
        console.error("Error fetching products by name:", error);
        return [];
    }
};