import { defineQuery } from "next-sanity";
import { sanityFetch } from "../live";
import { HomepageSection } from "@/sanity.types";

export const getHomepageSections = async (): Promise<HomepageSection[]> => {
  const HOMEPAGE_SECTIONS_QUERY = defineQuery(`
    *[_type == "homepageSection" && isActive == true] | order(sortOrder asc)
  `);

  try {
    const sections = await sanityFetch({
      query: HOMEPAGE_SECTIONS_QUERY,
    });
    return sections.data || [];
  } catch (error) {
    console.error("Error fetching homepage sections:", error);
    return [];
  }
};
