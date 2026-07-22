import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCmsAdmin } from '@/lib/auth'
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response'
import { deleteMediaFile } from '@/lib/media-storage'
import { fireWebhooks } from '@/lib/webhooks'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requireCmsAdmin()
    const { id } = await params
    const body = await req.json()

    const media = await prisma.media.update({
      where: { id },
      data: {
        altText: body.altText,
        folderId: body.folderId ?? null,
      },
    })
    return successResponse({ ...media, createdAt: media.createdAt.toISOString() })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requireCmsAdmin()
    const { id } = await params

    const media = await prisma.media.findUnique({ where: { id } })
    if (!media) return errorResponse('NOT_FOUND', 'Media not found', 404)

    // Delete files from disk
    await deleteMediaFile(media.diskPath, media.thumbPath)

    // Delete DB record
    await prisma.media.delete({ where: { id } })
    await fireWebhooks('media.deleted', { id, type: 'media' })

    return new Response(null, { status: 204 })
  } catch (err) {
    return handleApiError(err)
  }
}
