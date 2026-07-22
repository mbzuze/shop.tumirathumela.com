import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { BrandEditor } from '@/components/brands/BrandEditor'

export default async function BrandPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (id === 'new') return <BrandEditor brand={null} />

  const brand = await prisma.brand.findUnique({
    where: { id },
    include: { logo: { select: { id: true, publicUrl: true, altText: true, thumbUrl: true } } },
  })
  if (!brand) notFound()

  return <BrandEditor brand={brand} />
}
