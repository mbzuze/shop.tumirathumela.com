import { defineQuery } from "next-sanity";
import { sanityFetch } from "../live";
import { HeroBanner } from "@/sanity.types";

export const getHeroBanners = async (): Promise<HeroBanner[]> => {
  const HERO_BANNERS_QUERY = defineQuery(`
    *[_type == "heroBanner" && isActive == true] | order(sortOrder asc)
  `);

  try {
    const banners = await sanityFetch({
      query: HERO_BANNERS_QUERY,
    });
    return banners.data || [];
  } catch (error) {
    console.error("Error fetching hero banners:", error);
    return [];
  }
};
