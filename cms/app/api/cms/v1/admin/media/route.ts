import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCmsAdmin } from '@/lib/auth'
import { successResponse, handleApiError, paginationParams } from '@/lib/api-response'

export async function GET(req: NextRequest) {
  try {
    await requireCmsAdmin()
    const { page, pageSize, skip } = paginationParams(req.nextUrl.searchParams)
    const type = req.nextUrl.searchParams.get('type') ?? undefined
    const folderId = req.nextUrl.searchParams.get('folderId') ?? undefined
    const search = req.nextUrl.searchParams.get('q') ?? undefined

    const where = {
      ...(type ? { type: type as 'IMAGE' | 'VIDEO' | 'DOCUMENT' } : {}),
      ...(folderId === 'null' ? { folderId: null } : folderId ? { folderId } : {}),
      ...(search ? { originalName: { contains: search, mode: 'insensitive' as const } } : {}),
    }

    const [media, total] = await Promise.all([
      prisma.media.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { folder: { select: { id: true, name: true } } },
      }),
      prisma.media.count({ where }),
    ])

    // Get folder tree
    const folders = await prisma.mediaFolder.findMany({
      orderBy: { name: 'asc' },
      include: {
        children: { orderBy: { name: 'asc' } },
      },
      where: { parentId: null },
    })

    return successResponse(
      { media: media.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })), folders },
      { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
    )
  } catch (err) {
    return handleApiError(err)
  }
}
