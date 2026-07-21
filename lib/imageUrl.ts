/**
 * imageUrl compatibility shim.
 *
 * With TumiraCMS, media objects have a direct `url` field.
 * This helper wraps both legacy Sanity image objects and new CMS media objects
 * so components can continue calling imageUrl(src).url() unchanged.
 */

interface UrlBuilder {
  url: () => string
  width: (w: number) => UrlBuilder
  height: (h: number) => UrlBuilder
  fit: (f: string) => UrlBuilder
  auto: (a: string) => UrlBuilder
  quality: (q: number) => UrlBuilder
}

type ImageSource =
  | { url?: string; thumbnailUrl?: string }
  | { asset?: { _ref?: string; url?: string } }
  | string
  | null
  | undefined

function noop(this: UrlBuilder): UrlBuilder { return this }

function makeBuilder(resolvedUrl: string): UrlBuilder {
  const builder: UrlBuilder = {
    url: () => resolvedUrl,
    width: noop,
    height: noop,
    fit: noop,
    auto: noop,
    quality: noop,
  }
  return builder
}

function resolveUrl(source: ImageSource): string {
  if (!source) return '/placeholder-product.png'
  if (typeof source === 'string') return source

  // CMS format: { url: '...', thumbnailUrl: '...' }
  const asMedia = source as { url?: string; thumbnailUrl?: string }
  if (asMedia.url) return asMedia.url

  // Sanity format: { asset: { url?: string, _ref?: string } }
  const asSanity = source as { asset?: { _ref?: string; url?: string } }
  if (asSanity.asset?.url) return asSanity.asset.url

  return '/placeholder-product.png'
}

export function imageUrl(source: ImageSource): UrlBuilder {
  return makeBuilder(resolveUrl(source))
}
