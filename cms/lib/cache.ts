import { redis } from './redis'

export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>
): Promise<T> {
  try {
    const cached = await redis.get(key)
    if (cached) return JSON.parse(cached) as T
  } catch {
    // Redis unavailable — fall through to DB
  }

  const result = await fn()

  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(result))
  } catch {
    // Cache write failure is non-fatal
  }

  return result
}

export async function invalidateCache(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) await redis.del(...keys)
  } catch {
    // Non-fatal
  }
}

export const CacheKeys = {
  products: (page: number, pageSize: number, category?: string) =>
    `cms:products:${page}:${pageSize}:${category ?? 'all'}`,
  product: (slug: string) => `cms:product:${slug}`,
  categories: () => `cms:categories:all`,
  category: (slug: string) => `cms:category:${slug}`,
  collection: (slug: string) => `cms:collection:${slug}`,
  search: (q: string) => `cms:search:${q}`,
  settings: (key: string) => `cms:settings:${key}`,
  heroBanners: () => `cms:hero-banners`,
  homepageSections: (locale: string) => `cms:homepage:${locale}`,
  brands: () => `cms:brands`,
  bestSellers: () => `cms:best-sellers`,
} as const
