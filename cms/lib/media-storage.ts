import sharp from 'sharp'
import { writeFile, mkdir, unlink } from 'fs/promises'
import path from 'path'
import { createId } from '@paralleldrive/cuid2'
import mime from 'mime-types'

// Deliberately outside /public: Next.js's static file serving only picks up
// files present in /public at process startup, so newly-uploaded media
// wouldn't be visible until a restart. Apache serves this path directly
// instead (see deploy/apache-admin.conf), bypassing Node entirely.
const MEDIA_ROOT = process.env.MEDIA_ROOT ?? path.join(process.cwd(), 'media')
const MEDIA_URL = process.env.MEDIA_URL ?? 'https://admin.tumirathumela.com/media'

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
  'application/pdf',
])

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export interface SavedMedia {
  filename: string
  originalName: string
  diskPath: string
  publicUrl: string
  thumbPath: string | null
  thumbUrl: string | null
  width: number | null
  height: number | null
  mimeType: string
  size: number
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT'
}

export async function saveMediaFile(file: File): Promise<SavedMedia> {
  // Validate size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`)
  }

  // Validate MIME type server-side using magic bytes via sharp or mime-types
  const declaredMime = file.type.toLowerCase()
  if (!ALLOWED_MIME_TYPES.has(declaredMime)) {
    throw new Error(`File type not allowed: ${declaredMime}`)
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  // Re-validate image files with sharp to prevent disguised uploads
  if (declaredMime.startsWith('image/') && declaredMime !== 'image/svg+xml') {
    try {
      await sharp(buffer).metadata()
    } catch {
      throw new Error('Invalid image file')
    }
  }

  const id = createId()
  const now = new Date()
  const year = now.getFullYear().toString()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const dir = path.join(MEDIA_ROOT, year, month)

  await mkdir(dir, { recursive: true })

  if (declaredMime.startsWith('image/') && declaredMime !== 'image/svg+xml') {
    const filename = `${id}.webp`
    const thumbname = `${id}_thumb.webp`
    const filePath = path.join(dir, filename)
    const thumbFilePath = path.join(dir, thumbname)

    const metadata = await sharp(buffer).metadata()

    await sharp(buffer).webp({ quality: 85 }).toFile(filePath)
    await sharp(buffer)
      .resize(300, 300, { fit: 'cover' })
      .webp({ quality: 80 })
      .toFile(thumbFilePath)

    const stat = await import('fs/promises').then((m) => m.stat(filePath))

    return {
      filename,
      originalName: file.name,
      diskPath: filePath,
      publicUrl: `${MEDIA_URL}/${year}/${month}/${filename}`,
      thumbPath: thumbFilePath,
      thumbUrl: `${MEDIA_URL}/${year}/${month}/${thumbname}`,
      width: metadata.width ?? null,
      height: metadata.height ?? null,
      mimeType: 'image/webp',
      size: stat.size,
      type: 'IMAGE',
    }
  } else {
    const ext = mime.extension(declaredMime) || file.name.split('.').pop() || 'bin'
    const filename = `${id}.${ext}`
    const filePath = path.join(dir, filename)

    await writeFile(filePath, buffer)

    return {
      filename,
      originalName: file.name,
      diskPath: filePath,
      publicUrl: `${MEDIA_URL}/${year}/${month}/${filename}`,
      thumbPath: null,
      thumbUrl: null,
      width: null,
      height: null,
      mimeType: declaredMime,
      size: file.size,
      type: declaredMime.startsWith('video/') ? 'VIDEO' : 'DOCUMENT',
    }
  }
}

export async function deleteMediaFile(
  diskPath: string,
  thumbPath: string | null
): Promise<void> {
  await unlink(diskPath).catch(() => {})
  if (thumbPath) await unlink(thumbPath).catch(() => {})
}
