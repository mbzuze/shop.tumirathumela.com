'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { Link as TiptapLink } from '@tiptap/extension-link'
import { Image as TiptapImage } from '@tiptap/extension-image'
import { Placeholder } from '@tiptap/extension-placeholder'
import { CharacterCount } from '@tiptap/extension-character-count'
import type { JSONContent } from '@tiptap/core'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Quote,
  Code,
  Link2,
  Image,
  Undo,
  Redo,
  RemoveFormatting,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCallback, useState } from 'react'
import { MediaPickerModal } from '@/components/media/MediaPickerModal'

interface TiptapEditorProps {
  value: JSONContent | null
  onChange: (value: JSONContent) => void
  placeholder?: string
  maxChars?: number
  className?: string
  readOnly?: boolean
}

export function TiptapEditor({
  value,
  onChange,
  placeholder = 'Write a description...',
  maxChars,
  className,
  readOnly = false,
}: TiptapEditorProps) {
  const [mediaOpen, setMediaOpen] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      TiptapLink.configure({
        autolink: true,
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', class: 'text-orange-500 underline' },
      }),
      TiptapImage.configure({
        HTMLAttributes: { class: 'max-w-full rounded-lg my-2' },
      }),
      Placeholder.configure({ placeholder }),
      ...(maxChars ? [CharacterCount.configure({ limit: maxChars })] : []),
    ],
    content: value ?? { type: 'doc', content: [{ type: 'paragraph' }] },
    editable: !readOnly,
    onUpdate({ editor }) {
      onChange(editor.getJSON())
    },
  })

  const setLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href as string
    const url = window.prompt('URL', previousUrl)
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  const insertImage = useCallback((url: string, alt?: string) => {
    if (!editor) return
    editor.chain().focus().setImage({ src: url, alt: alt ?? '' }).run()
    setMediaOpen(false)
  }, [editor])

  if (!editor) return null

  const charCount = maxChars ? editor.storage.characterCount?.characters?.() ?? 0 : null

  return (
    <div className={cn('border border-slate-200 rounded-xl overflow-hidden bg-white', className)}>
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-slate-100 bg-slate-50">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>
          <Divider />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive('heading', { level: 3 })}
            title="Heading 3"
          >
            <Heading3 className="w-4 h-4" />
          </ToolbarButton>
          <Divider />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            title="Bullet list"
          >
            <List className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            title="Ordered list"
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>
          <Divider />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive('blockquote')}
            title="Blockquote"
          >
            <Quote className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            active={editor.isActive('code')}
            title="Inline code"
          >
            <Code className="w-4 h-4" />
          </ToolbarButton>
          <Divider />
          <ToolbarButton onClick={setLink} active={editor.isActive('link')} title="Add link">
            <Link2 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => setMediaOpen(true)} active={false} title="Insert image">
            <Image className="w-4 h-4" />
          </ToolbarButton>
          <Divider />
          <ToolbarButton
            onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
            active={false}
            title="Clear formatting"
          >
            <RemoveFormatting className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            active={false}
            title="Undo"
            disabled={!editor.can().undo()}
          >
            <Undo className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            active={false}
            title="Redo"
            disabled={!editor.can().redo()}
          >
            <Redo className="w-4 h-4" />
          </ToolbarButton>
        </div>
      )}

      {/* Editor content */}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-4 min-h-[200px] focus-within:outline-none"
      />

      {/* Character count */}
      {maxChars && charCount !== null && (
        <div className="px-4 pb-2 flex justify-end">
          <span className={cn('text-xs', charCount > maxChars * 0.9 ? 'text-red-500' : 'text-slate-400')}>
            {charCount} / {maxChars}
          </span>
        </div>
      )}

      {/* Media picker modal */}
      <MediaPickerModal
        open={mediaOpen}
        onClose={() => setMediaOpen(false)}
        onSelect={(media) => insertImage(media.publicUrl, media.altText ?? undefined)}
        accept="image"
      />
    </div>
  )
}

function ToolbarButton({
  children,
  onClick,
  active,
  title,
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  active: boolean
  title: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={cn(
        'p-1.5 rounded-md transition-colors text-slate-600 hover:bg-slate-200',
        active && 'bg-slate-200 text-orange-600',
        disabled && 'opacity-30 cursor-not-allowed'
      )}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="w-px h-5 bg-slate-200 mx-1" />
}
