import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCmsAdmin } from '@/lib/auth'
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response'
import { saveMediaFile } from '@/lib/media-storage'
import { fireWebhooks } from '@/lib/webhooks'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireCmsAdmin()

    const formData = await req.formData()
    const file = formData.get('file')
    const folderId = formData.get('folderId') as string | null
    const altText = formData.get('altText') as string | null

    if (!file || !(file instanceof File)) {
      return errorResponse('BAD_REQUEST', 'No file provided', 400)
    }

    const saved = await saveMediaFile(file)

    const media = await prisma.media.create({
      data: {
        filename: saved.filename,
        originalName: saved.originalName,
        mimeType: saved.mimeType,
        size: saved.size,
        width: saved.width,
        height: saved.height,
        diskPath: saved.diskPath,
        publicUrl: saved.publicUrl,
        thumbPath: saved.thumbPath,
        thumbUrl: saved.thumbUrl,
        altText: altText ?? undefined,
        type: saved.type,
        folderId: folderId ?? undefined,
        uploadedBy: userId,
      },
    })

    await fireWebhooks('media.uploaded', { id: media.id, type: 'media' })

    return successResponse({ ...media, createdAt: media.createdAt.toISOString() }, undefined, 201)
  } catch (err) {
    return handleApiError(err)
  }
}
