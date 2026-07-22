import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { HomepageSectionEditor } from '@/components/homepage-sections/HomepageSectionEditor'

export default async function HomepageSectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (id === 'new') return <HomepageSectionEditor section={null} />

  const section = await prisma.homepageSection.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { sortOrder: 'asc' },
        include: { media: { select: { id: true, publicUrl: true, thumbUrl: true, altText: true } } },
      },
    },
  })
  if (!section) notFound()

  return <HomepageSectionEditor section={section} />
}
