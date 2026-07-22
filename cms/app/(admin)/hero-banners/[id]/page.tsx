import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { HeroBannerEditor } from '@/components/hero-banners/HeroBannerEditor'

export default async function HeroBannerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (id === 'new') return <HeroBannerEditor banner={null} />

  const banner = await prisma.heroBanner.findUnique({
    where: { id },
    include: { media: { select: { id: true, publicUrl: true, thumbUrl: true, altText: true } } },
  })
  if (!banner) notFound()

  return (
    <HeroBannerEditor
      banner={{
        ...banner,
        startsAt: banner.startsAt?.toISOString() ?? null,
        endsAt: banner.endsAt?.toISOString() ?? null,
      }}
    />
  )
}
