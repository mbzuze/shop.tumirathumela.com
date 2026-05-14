import { defineQuery } from "next-sanity";
import { sanityFetch } from "../live";
import { Brand } from "@/sanity.types";

export const getBrands = async (): Promise<Brand[]> => {
  const BRANDS_QUERY = defineQuery(`
    *[_type == "brand"] | order(sortOrder asc)
  `);

  try {
    const brands = await sanityFetch({
      query: BRANDS_QUERY,
    });
    return brands.data || [];
  } catch (error) {
    console.error("Error fetching brands:", error);
    return [];
  }
};
