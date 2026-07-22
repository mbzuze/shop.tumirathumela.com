import { generateHTML } from '@tiptap/html'
import { StarterKit } from '@tiptap/starter-kit'
import { Link } from '@tiptap/extension-link'
import { Image } from '@tiptap/extension-image'
import type { JSONContent } from '@tiptap/core'

export type { JSONContent }

export function renderRichText(json: JSONContent): string {
  try {
    return generateHTML(json, [StarterKit, Link, Image])
  } catch {
    return ''
  }
}

export function isEmptyRichText(json: JSONContent | null | undefined): boolean {
  if (!json) return true
  if (!json.content || json.content.length === 0) return true
  return json.content.every(
    (node) => node.type === 'paragraph' && (!node.content || node.content.length === 0)
  )
}

export function richTextToPlainText(json: JSONContent): string {
  function extractText(node: JSONContent): string {
    if (node.type === 'text') return node.text ?? ''
    if (!node.content) return ''
    return node.content.map(extractText).join(' ')
  }
  return extractText(json).replace(/\s+/g, ' ').trim()
}
