import { Category, Product } from "@/sanity.types";
import { imageUrl } from "@/lib/imageUrl";
import Image from "next/image";
import Link from "next/link";

interface HomeCategoryCardProps {
  category: Category;
  products: Product[];
}

export default function HomeCategoryCard({ category, products }: HomeCategoryCardProps) {
  return (
    <div className="bg-white p-4 rounded-md shadow-sm">
      <h2 className="text-xl font-bold mb-2">{category.name}</h2>
      <div className="grid grid-cols-2 gap-4 mb-4">
        {products.slice(0, 4).map((product, i) => (
          <Link key={product._id} href={`/product/${product.slug?.current}`}>
            <div className="aspect-square relative">
                {product.images?.[0] ? (
                    <Image
                        src={imageUrl(product.images[0]).url()}
                        alt={product.name || ""}
                        fill
                        className="object-cover rounded"
                    />
                ) : <div className="bg-gray-200 w-full h-full"></div>}
                 <p className="text-xs absolute bottom-0 bg-white/70 p-1 w-full truncate">{product.name}</p>
            </div>
          </Link>
        ))}
      </div>
      <Link
        href={`/categories/${category.slug?.current}`}
        className="text-sm text-blue-600 hover:underline"
      >
        Shop now
      </Link>
    </div>
  );
}
