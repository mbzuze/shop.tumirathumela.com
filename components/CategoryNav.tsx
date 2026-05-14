import { getAllCategories } from "@/sanity/lib/products/getAllCategories";
import { Category } from "@/sanity.types";
import Link from "next/link";

export default async function CategoryNav() {
  const categories = (await getAllCategories()) as Category[];

  return (
    <div className="flex items-center bg-[#232F3E] text-white px-4 py-1 text-sm space-x-4 overflow-x-auto">
      {categories.slice(0, 12).map((cat) => (
        <Link
          href={`/categories/${cat.slug?.current}`}
          key={cat._id}
          className="hover:underline p-1 flex-shrink-0"
        >
          {cat.name}
        </Link>
      ))}
    </div>
  );
}
