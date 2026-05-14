import { getHeroBanners } from "@/sanity/lib/home/getHeroBanners";
import { getHomepageSections } from "@/sanity/lib/home/getHomepageSections";
import { getAllCategories } from "@/sanity/lib/products/getAllCategories";
import { getBrands } from "@/sanity/lib/products/getBrands";

import HeroCarousel from "@/components/home/HeroCarousel";
import HomepageGrid from "@/components/home/HomepageGrid";
import ShopByBrand from "@/components/home/ShopByBrand";
import CategoryCircles from "@/components/home/CategoryCircles";
import PromoRow from "@/components/home/PromoRow";
import PersonalisedRecommendations from "@/components/home/PersonalisedRecommendations";

export default async function Home() {
  const banners = await getHeroBanners();
  const sections = await getHomepageSections();
  const categories = await getAllCategories();
  const brands = await getBrands();

  return (
    <div className="bg-[#E3E6E6] min-h-screen pb-12 flex flex-col">
      <HeroCarousel banners={banners} />
      
      <div className="flex-grow flex flex-col space-y-4">
        <HomepageGrid sections={sections} />
        <CategoryCircles categories={categories} />
        <PromoRow categories={categories} />
        <ShopByBrand brands={brands} />
        <PersonalisedRecommendations />
      </div>
    </div>
  );
}
