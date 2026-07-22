import { prisma } from '@/lib/prisma'
import { CategoriesTree } from '@/components/categories/CategoriesTree'

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      image: true,
      _count: { select: { products: true } },
    },
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
        <p className="text-sm text-slate-500 mt-1">{categories.length} categories total</p>
      </div>
      <CategoriesTree
        categories={categories.map((c) => ({
          ...c,
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString(),
        }))}
      />
    </div>
  )
}
