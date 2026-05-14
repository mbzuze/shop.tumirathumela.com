"use client";

import { useRouter, useSearchParams } from "next/navigation";

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Avg. Customer Review" },
  { value: "newest", label: "Newest Arrivals" },
];

export default function SortSelect({ current }: { current: string }) {
  const router = useRouter();
  const params = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = new URLSearchParams(params.toString());
    next.set("sort", e.target.value);
    router.push(`/search?${next.toString()}`);
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-[#0F1111] font-medium whitespace-nowrap">Sort by:</span>
      <select
        id="sort-select"
        value={current}
        onChange={handleChange}
        className="border border-[#888c8c] rounded-sm px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#e77600]"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
