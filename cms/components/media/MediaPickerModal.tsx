'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Search, Upload, X, Check, FolderOpen, Image, FileVideo, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { MediaDto } from '@/types/cms'

interface MediaPickerModalProps {
  open: boolean
  onClose: () => void
  onSelect: (media: MediaDto) => void
  accept?: 'image' | 'video' | 'all'
  multiple?: boolean
}

export function MediaPickerModal({ open, onClose, onSelect, accept = 'all' }: MediaPickerModalProps) {
  const [media, setMedia] = useState<MediaDto[]>([])
  const [selected, setSelected] = useState<MediaDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 24

  const fetchMedia = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(search ? { q: search } : {}),
        ...(accept === 'image' ? { type: 'IMAGE' } : accept === 'video' ? { type: 'VIDEO' } : {}),
      })
      const res = await fetch(`/api/cms/v1/admin/media?${params}`)
      const json = await res.json()
      if (json.success) {
        setMedia(json.data.media)
        setTotal(json.meta?.total ?? 0)
      }
    } catch {
      toast.error('Failed to load media')
    } finally {
      setLoading(false)
    }
  }, [page, search, accept])

  useEffect(() => {
    if (open) fetchMedia()
  }, [open, fetchMedia])

  const onDrop = useCallback(async (files: File[]) => {
    if (!files.length) return
    setUploading(true)
    try {
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch('/api/cms/v1/admin/media/upload', {
          method: 'POST',
          body: formData,
        })
        if (!res.ok) throw new Error('Upload failed')
      }
      toast.success(`${files.length} file(s) uploaded`)
      fetchMedia()
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }, [fetchMedia])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept === 'image' ? { 'image/*': [] } : accept === 'video' ? { 'video/*': [] } : undefined,
    multiple: true,
  })

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900 text-lg">Media Library</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search files..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
            />
          </div>
        </div>

        {/* Drop zone */}
        <div
          {...getRootProps()}
          className={cn(
            'mx-4 mt-3 border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors',
            isDragActive ? 'border-orange-400 bg-orange-50' : 'border-slate-200 hover:border-slate-300'
          )}
        >
          <input {...getInputProps()} />
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : isDragActive ? 'Drop files here' : 'Drop files here or click to upload'}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-square bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : media.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <FolderOpen className="w-10 h-10 mb-3" />
              <p className="text-sm">No media files found</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {media.map((item) => (
                <MediaItem
                  key={item.id}
                  item={item}
                  selected={selected?.id === item.id}
                  onSelect={setSelected}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-200">
          <div className="flex items-center gap-2">
            {total > pageSize && (
              <>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="text-xs px-3 py-1.5 border rounded-lg disabled:opacity-30 hover:bg-slate-50"
                >
                  Prev
                </button>
                <span className="text-xs text-slate-500">
                  {page} / {Math.ceil(total / pageSize)}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= Math.ceil(total / pageSize)}
                  className="text-xs px-3 py-1.5 border rounded-lg disabled:opacity-30 hover:bg-slate-50"
                >
                  Next
                </button>
              </>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => selected && onSelect(selected)}
              disabled={!selected}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium disabled:opacity-40 transition-colors"
            >
              Select
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MediaItem({
  item,
  selected,
  onSelect,
}: {
  item: MediaDto
  selected: boolean
  onSelect: (item: MediaDto) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className={cn(
        'relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer group',
        selected ? 'border-orange-500 ring-2 ring-orange-500/30' : 'border-transparent hover:border-slate-300'
      )}
    >
      {item.type === 'IMAGE' ? (
        // eslint-disable-next-line @next/next-eslint/no-img-element
        <img
          src={item.thumbUrl ?? item.publicUrl}
          alt={item.altText ?? item.originalName}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center gap-1">
          {item.type === 'VIDEO' ? (
            <FileVideo className="w-6 h-6 text-slate-400" />
          ) : (
            <FileText className="w-6 h-6 text-slate-400" />
          )}
          <span className="text-xs text-slate-400 px-1 truncate max-w-full">{item.originalName}</span>
        </div>
      )}

      {selected && (
        <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-white text-xs truncate">{item.originalName}</p>
      </div>
    </button>
  )
}
