import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import Image from 'next/image'
import { BrandActions } from '@/components/brands/BrandActions'

export default async function BrandsPage() {
  const brands = await prisma.brand.findMany({
    orderBy: { name: 'asc' },
    include: {
      logo: { select: { publicUrl: true, altText: true } },
      _count: { select: { products: true } },
    },
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Brands</h1>
          <p className="text-sm text-slate-500 mt-1">{brands.length} brands</p>
        </div>
        <Link href="/brands/new" className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Brand
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600 w-16"></th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Brand</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Products</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Active</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {brands.map((brand) => (
              <tr key={brand.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-4 py-3">
                  {brand.logo ? (
                    <Image src={brand.logo.publicUrl} alt={brand.logo.altText ?? brand.name} width={40} height={40} className="w-10 h-10 object-contain rounded-lg bg-slate-100" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400">{brand.name.charAt(0)}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800">{brand.name}</p>
                  <p className="text-xs text-slate-400">{brand.slug}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">{brand._count.products}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${brand.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{brand.isActive ? 'Active' : 'Inactive'}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <Link href={`/brands/${brand.id}`} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs hover:bg-slate-50 transition-colors">Edit</Link>
                    <BrandActions brandId={brand.id} productCount={brand._count.products} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {brands.length === 0 && <div className="text-center py-12 text-slate-400 text-sm">No brands yet.</div>}
      </div>
    </div>
  )
}
