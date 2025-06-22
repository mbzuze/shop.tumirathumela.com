import React from 'react'
import { notFound } from 'next/navigation'
import { getProductBySlug } from '@/sanity/lib/products/getProductBySlug';
import { imageUrl } from '@/lib/imageUrl';
import Image from 'next/image';
import { PortableText } from 'next-sanity';

async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const product = await getProductBySlug(slug);

  if (!product) {
    notFound()
  }

  const isOutOfStock = product.quantity != null && product.quantity <= 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className={`relative aspect-square overflow-hidden rounded-lg ${isOutOfStock ? 'opacity-50' : ''}`}>
            {product.image && (
                <Image src={imageUrl(product.image).url()} alt={product.name ?? "Product image"} className="object-contain transition-transform duration-300 transform hover:scale-105" fill />
            )}
            {isOutOfStock && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
                    <span className="text-white font-bold text-lg">Out of Stock</span>
                </div>
            )}
        </div>
        
        <div className="flex flex-col justify-between">
            <div>
                <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
                <div className="text-xl font-semibold mb-4">
                    ${product.price?.toFixed(2) ?? 'N/A'}
                </div>
                <div className="prose max-w-none mb-6">
                    {Array.isArray(product.description) && (
                        <PortableText value={product.description} />
                    )}
                </div>
        
            </div>
           
        
        </div>
                
      </div>
    </div>
  )
}

export default ProductPage;