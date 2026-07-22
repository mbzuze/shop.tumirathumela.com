'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  Search, Upload, Trash2, FolderPlus, Grid3x3, List, X,
  Image as ImageIcon, FileVideo, FileText, FolderOpen,
} from 'lucide-react'
import { cn, formatBytes } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { MediaDto, MediaFolderDto } from '@/types/cms'

interface Props {
  initialMedia: MediaDto[]
  initialTotal: number
  folders: MediaFolderDto[]
}

export function MediaLibraryClient({ initialMedia, initialTotal, folders }: Props) {
  const [media, setMedia] = useState(initialMedia)
  const [total, setTotal] = useState(initialTotal)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [activeFolder, setActiveFolder] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [selectedMedia, setSelectedMedia] = useState<MediaDto | null>(null)
  const pageSize = 48

  const fetchMedia = useCallback(async () => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...(search ? { q: search } : {}),
      ...(typeFilter ? { type: typeFilter } : {}),
      ...(activeFolder ? { folderId: activeFolder } : {}),
    })
    const res = await fetch(`/api/cms/v1/admin/media?${params}`)
    const json = await res.json()
    if (json.success) {
      setMedia(json.data.media)
      setTotal(json.meta?.total ?? 0)
    }
  }, [page, search, typeFilter, activeFolder])

  useEffect(() => { fetchMedia() }, [fetchMedia])

  const onDrop = useCallback(async (files: File[]) => {
    setUploading(true)
    let done = 0
    for (const file of files) {
      const formData = new FormData()
      formData.append('file', file)
      if (activeFolder) formData.append('folderId', activeFolder)
      try {
        const res = await fetch('/api/cms/v1/admin/media/upload', { method: 'POST', body: formData })
        if (!res.ok) toast.error(`Failed to upload ${file.name}`)
        else done++
      } catch {
        toast.error(`Failed to upload ${file.name}`)
      }
      setUploadProgress(Math.round(((done) / files.length) * 100))
    }
    setUploading(false)
    setUploadProgress(0)
    if (done > 0) {
      toast.success(`${done} file${done > 1 ? 's' : ''} uploaded`)
      fetchMedia()
    }
  }, [activeFolder, fetchMedia])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: true })

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const deleteSelected = async () => {
    if (selected.size === 0) return
    if (!confirm(`Delete ${selected.size} file${selected.size > 1 ? 's' : ''}? This cannot be undone.`)) return
    let done = 0
    for (const id of selected) {
      const res = await fetch(`/api/cms/v1/admin/media/${id}`, { method: 'DELETE' })
      if (res.ok) done++
    }
    toast.success(`${done} file${done > 1 ? 's' : ''} deleted`)
    setSelected(new Set())
    fetchMedia()
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="flex h-[calc(100vh-120px)] gap-4">
      {/* Folder sidebar */}
      <aside className="w-52 flex-shrink-0 bg-white rounded-xl border border-slate-200 p-3 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-slate-700">Folders</p>
          <button
            onClick={async () => {
              const name = prompt('Folder name:')
              if (!name) return
              await fetch('/api/cms/v1/admin/media/folders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
              })
              toast.success('Folder created')
            }}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={() => setActiveFolder(null)}
          className={cn('flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm w-full text-left transition-colors', !activeFolder ? 'bg-orange-50 text-orange-600' : 'text-slate-600 hover:bg-slate-50')}
        >
          <FolderOpen className="w-4 h-4" />
          All files
        </button>
        {folders.map((folder) => (
          <button
            key={folder.id}
            onClick={() => setActiveFolder(folder.id)}
            className={cn('flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm w-full text-left transition-colors mt-0.5', activeFolder === folder.id ? 'bg-orange-50 text-orange-600' : 'text-slate-600 hover:bg-slate-50')}
          >
            <FolderOpen className="w-4 h-4" />
            {folder.name}
          </button>
        ))}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search files..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none"
            >
              <option value="">All types</option>
              <option value="IMAGE">Images</option>
              <option value="VIDEO">Videos</option>
              <option value="DOCUMENT">Documents</option>
            </select>
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
              <button onClick={() => setView('grid')} className={cn('p-2 transition-colors', view === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-50')}>
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button onClick={() => setView('list')} className={cn('p-2 transition-colors', view === 'list' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-50')}>
                <List className="w-4 h-4" />
              </button>
            </div>
            {selected.size > 0 && (
              <button
                onClick={deleteSelected}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete ({selected.size})
              </button>
            )}
          </div>
        </div>

        {/* Drop zone */}
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-xl px-4 py-3 text-center cursor-pointer transition-colors mb-3',
            isDragActive ? 'border-orange-400 bg-orange-50' : 'border-slate-200 hover:border-slate-300 bg-white'
          )}
        >
          <input {...getInputProps()} />
          <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
            <Upload className="w-4 h-4" />
            {uploading ? `Uploading... ${uploadProgress}%` : 'Drop files here or click to upload'}
          </div>
        </div>

        {/* Grid / List */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-y-auto p-3">
          {media.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <FolderOpen className="w-12 h-12 mb-3" />
              <p>No files here yet</p>
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
              {media.map((item) => (
                <MediaGridItem
                  key={item.id}
                  item={item}
                  selected={selected.has(item.id)}
                  onToggle={() => toggleSelect(item.id)}
                  onClick={() => setSelectedMedia(item)}
                />
              ))}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left">
                  <th className="pb-2 font-medium text-slate-500">File</th>
                  <th className="pb-2 font-medium text-slate-500">Type</th>
                  <th className="pb-2 font-medium text-slate-500">Size</th>
                  <th className="pb-2 font-medium text-slate-500">Uploaded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {media.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/60 cursor-pointer"
                    onClick={() => setSelectedMedia(item)}
                  >
                    <td className="py-2 flex items-center gap-2">
                      {item.type === 'IMAGE' ? (
                        // eslint-disable-next-line @next/next-eslint/no-img-element
                        <img src={item.thumbUrl ?? item.publicUrl} alt="" className="w-8 h-8 object-cover rounded" />
                      ) : item.type === 'VIDEO' ? (
                        <FileVideo className="w-8 h-8 text-slate-400" />
                      ) : (
                        <FileText className="w-8 h-8 text-slate-400" />
                      )}
                      <span className="text-slate-700 truncate max-w-xs">{item.originalName}</span>
                    </td>
                    <td className="py-2 text-slate-500">{item.mimeType}</td>
                    <td className="py-2 text-slate-500">{formatBytes(item.size)}</td>
                    <td className="py-2 text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-3 text-sm text-slate-500">
            <span>{total} total files</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded-lg disabled:opacity-30 hover:bg-slate-50">Prev</button>
              <span>{page} / {totalPages}</span>
              <button onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages} className="px-3 py-1 border rounded-lg disabled:opacity-30 hover:bg-slate-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selectedMedia && (
        <aside className="w-64 flex-shrink-0 bg-white rounded-xl border border-slate-200 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-700">Details</p>
            <button onClick={() => setSelectedMedia(null)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          {selectedMedia.type === 'IMAGE' ? (
            // eslint-disable-next-line @next/next-eslint/no-img-element
            <img src={selectedMedia.thumbUrl ?? selectedMedia.publicUrl} alt="" className="w-full rounded-lg object-cover aspect-square mb-3 bg-slate-100" />
          ) : selectedMedia.type === 'VIDEO' ? (
            <FileVideo className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          ) : (
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          )}

          <div className="space-y-2 text-xs text-slate-500 flex-1">
            <p className="font-medium text-slate-700 break-all">{selectedMedia.originalName}</p>
            <p>{selectedMedia.mimeType}</p>
            <p>{formatBytes(selectedMedia.size)}</p>
            {selectedMedia.width && <p>{selectedMedia.width} × {selectedMedia.height}px</p>}
            <p>{new Date(selectedMedia.createdAt).toLocaleDateString()}</p>
          </div>

          <div className="mt-4 space-y-2">
            <a
              href={selectedMedia.publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-xs px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
            >
              Open URL ↗
            </a>
            <button
              onClick={async () => {
                await fetch(`/api/cms/v1/admin/media/${selectedMedia.id}`, { method: 'DELETE' })
                toast.success('File deleted')
                setSelectedMedia(null)
                fetchMedia()
              }}
              className="w-full text-xs px-3 py-1.5 border border-red-200 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          </div>
        </aside>
      )}
    </div>
  )
}

function MediaGridItem({
  item,
  selected,
  onToggle,
  onClick,
}: {
  item: MediaDto
  selected: boolean
  onToggle: () => void
  onClick: () => void
}) {
  return (
    <div
      className={cn(
        'relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 group transition-all',
        selected ? 'border-orange-500 ring-1 ring-orange-500/30' : 'border-transparent hover:border-slate-300'
      )}
      onClick={onClick}
    >
      {item.type === 'IMAGE' ? (
        // eslint-disable-next-line @next/next-eslint/no-img-element
        <img src={item.thumbUrl ?? item.publicUrl} alt={item.altText ?? ''} className="w-full h-full object-cover" />
      ) : item.type === 'VIDEO' ? (
        <div className="w-full h-full bg-slate-100 flex items-center justify-center">
          <FileVideo className="w-6 h-6 text-slate-400" />
        </div>
      ) : (
        <div className="w-full h-full bg-slate-100 flex items-center justify-center">
          <FileText className="w-6 h-6 text-slate-400" />
        </div>
      )}

      {/* Select checkbox */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onToggle() }}
        className={cn(
          'absolute top-1 left-1 w-5 h-5 rounded-md border-2 transition-all',
          selected
            ? 'bg-orange-500 border-orange-500 opacity-100'
            : 'bg-white/80 border-slate-300 opacity-0 group-hover:opacity-100'
        )}
      />
    </div>
  )
}
