"use client";

import { HomepageSection } from "@/sanity.types";
import ShopCard from "./ShopCard";

interface HomepageGridProps {
  sections: HomepageSection[];
}

export default function HomepageGrid({ sections }: HomepageGridProps) {
  if (!sections || sections.length === 0) return null;

  return (
    <div className="relative -mt-32 md:-mt-48 lg:-mt-64 z-20 px-4 md:px-8 max-w-[1500px] mx-auto w-full mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {sections.map((section) => (
          <ShopCard key={section._id} section={section} />
        ))}
      </div>
    </div>
  );
}
