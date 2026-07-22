import { prisma } from '@/lib/prisma'
import { MediaLibraryClient } from '@/components/media/MediaLibraryClient'

export default async function MediaPage() {
  const [media, total, folders] = await Promise.all([
    prisma.media.findMany({
      orderBy: { createdAt: 'desc' },
      take: 48,
      include: { folder: { select: { id: true, name: true } } },
    }),
    prisma.media.count(),
    prisma.mediaFolder.findMany({
      where: { parentId: null },
      include: { children: { orderBy: { name: 'asc' } } },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <MediaLibraryClient
      initialMedia={media.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))}
      initialTotal={total}
      folders={folders.map((f) => ({
        ...f,
        createdAt: f.createdAt.toISOString(),
        children: f.children.map((c) => ({ ...c, createdAt: c.createdAt.toISOString(), children: [] })),
      }))}
    />
  )
}
