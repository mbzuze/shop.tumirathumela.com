import { prisma } from '@/lib/prisma'
import { ProductForm } from '@/components/products/ProductForm'

export default async function NewProductPage() {
  const [categories, brands, tags] = await Promise.all([
    prisma.category.findMany({ select: { id: true, name: true, slug: true, parentId: true }, orderBy: { name: 'asc' } }),
    prisma.brand.findMany({ select: { id: true, name: true, slug: true }, orderBy: { name: 'asc' } }),
    prisma.tag.findMany({ orderBy: { name: 'asc' } }),
  ])

  return <ProductForm categories={categories} brands={brands} tags={tags} />
}
