/**
 * TumiraCMS client for shop.tumirathumela.com
 * Drop-in replacement for Sanity data fetching.
 * All public requests include X-CMS-API-Key; all admin requests
 * use X-CMS-Admin-Key for server-side operations.
 *
 * Shapes here are verified against the real TumiraCMS route handlers and
 * Prisma schema (../../tumiracms), not the planning spec — field names and
 * response envelopes differ from the original spec doc in several places.
 */

import type { Product, Category, Brand, HeroBanner, HomepageSection, Slug } from '@/lib/cms-types'

const CMS_BASE = process.env.CMS_API_URL ?? 'https://admin.tumirathumela.com'
const CMS_API_KEY = process.env.CMS_API_KEY ?? ''
const CMS_ADMIN_KEY = process.env.CMS_ADMIN_KEY ?? ''

export class CmsError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message)
  }
}

async function cmsGet<T>(path: string, options: { admin?: boolean; revalidate?: number; tags?: string[] } = {}): Promise<T> {
  const key = options.admin ? CMS_ADMIN_KEY : CMS_API_KEY
  const res = await fetch(`${CMS_BASE}${path}`, {
    headers: { 'X-CMS-API-Key': key },
    next: {
      revalidate: options.revalidate ?? 60,
      tags: options.tags,
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new CmsError(res.status, body?.error?.code ?? 'UNKNOWN', body?.error?.message ?? `CMS request failed: ${res.status}`)
  }
  const json = await res.json()
  return json.data as T
}

async function cmsPost<T>(path: string, body: unknown, options: { admin?: boolean } = {}): Promise<T> {
  const key = options.admin ? CMS_ADMIN_KEY : CMS_API_KEY
  const res = await fetch(`${CMS_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CMS-API-Key': key },
    body: JSON.stringify(body),
    cache: 'no-store',
  })
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}))
    throw new CmsError(res.status, errBody?.error?.code ?? 'UNKNOWN', errBody?.error?.message ?? 'CMS write failed')
  }
  const json = await res.json()
  return json.data as T
}

async function cmsPatch<T>(path: string, body: unknown, options: { admin?: boolean } = {}): Promise<T> {
  const key = options.admin ? CMS_ADMIN_KEY : CMS_API_KEY
  // Optional fields on the CMS side are `.optional()`, not `.nullable()` — an
  // explicit `null` fails validation, so absent values must be omitted entirely.
  const sanitized = Object.fromEntries(
    Object.entries(body as Record<string, unknown>).filter(([, v]) => v !== null)
  )
  const res = await fetch(`${CMS_BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'X-CMS-API-Key': key },
    body: JSON.stringify(sanitized),
    cache: 'no-store',
  })
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}))
    throw new CmsError(res.status, errBody?.error?.code ?? 'UNKNOWN', errBody?.error?.message ?? 'CMS update failed')
  }
  const json = await res.json()
  return json.data as T
}

async function cmsDelete(path: string, options: { admin?: boolean } = {}): Promise<void> {
  const key = options.admin ? CMS_ADMIN_KEY : CMS_API_KEY
  const res = await fetch(`${CMS_BASE}${path}`, {
    method: 'DELETE',
    headers: { 'X-CMS-API-Key': key },
    cache: 'no-store',
  })
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}))
    throw new CmsError(res.status, errBody?.error?.code ?? 'UNKNOWN', errBody?.error?.message ?? 'CMS delete failed')
  }
}

// ── Shape adapters: TumiraCMS → legacy Sanity shapes ─────────────────────────
// The rest of the app (types generated from the old Sanity schema, plus
// ~20 components) still expects Sanity's document shape: `_id`, `slug.current`,
// image refs as `{ asset: { _ref, url } }`, rich text as Portable Text blocks.
// These adapters translate real TumiraCMS responses into that shape so
// existing components keep working unchanged.

function slugOf(value: string): Slug {
  return { _type: 'slug', current: value }
}

interface RawMedia {
  id: string
  publicUrl: string
}

function mediaImage(media: RawMedia | null | undefined) {
  if (!media) return undefined
  return {
    _key: media.id,
    _type: 'image' as const,
    asset: { _ref: media.id, _type: 'reference' as const, url: media.publicUrl },
  }
}

// TumiraCMS stores descriptions as Tiptap JSON; the storefront renders
// Portable Text. We don't have a full Tiptap→Portable Text transform, so we
// flatten to plain text and wrap it as a single paragraph block — enough to
// render a real description instead of silently showing none.
function tiptapPlainText(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const n = node as { text?: string; content?: unknown[] }
  if (typeof n.text === 'string') return n.text
  if (Array.isArray(n.content)) return n.content.map(tiptapPlainText).join(' ')
  return ''
}

function tiptapToPortableText(doc: unknown) {
  const text = tiptapPlainText(doc).trim()
  if (!text) return []
  return [
    {
      _type: 'block' as const,
      _key: 'body',
      style: 'normal' as const,
      children: [{ _type: 'span' as const, _key: 'body-0', text }],
    },
  ]
}

// ── Products ──────────────────────────────────────────────────────────────────

interface RawEntityRef { id: string; name: string; slug: string }
interface RawTag { id: string; name: string; slug: string }

interface RawProduct {
  id: string
  slug: string
  name: string
  sku: string | null
  description: unknown
  shortDescription: string | null
  price: number
  compareAtPrice: number | null
  stock: number
  rating: number | null
  reviewCount: number
  dealBadge: string | null
  dealPercent: number | null
  isFeatured: boolean
  isBestSeller: boolean
  category: RawEntityRef | null
  brand: RawEntityRef | null
  tags: RawTag[]
  images: Array<{ id: string; altText: string | null; media: RawMedia }>
  variants: Array<{ id: string; name: string; sku: string | null; price: number | null; stock: number; image: RawMedia | null }>
  createdAt: string
  updatedAt: string
}

function normProduct(p: RawProduct): Product {
  const normalized = {
    _id: p.id,
    _type: 'product',
    _createdAt: p.createdAt,
    _updatedAt: p.updatedAt,
    _rev: p.id,
    name: p.name,
    slug: slugOf(p.slug),
    sku: p.sku ?? undefined,
    images: (p.images ?? []).map((pi) => mediaImage(pi.media)).filter(Boolean),
    price: p.price,
    compareAtPrice: p.compareAtPrice ?? undefined,
    brand: p.brand ? { _id: p.brand.id, name: p.brand.name, slug: slugOf(p.brand.slug) } : undefined,
    category: p.category ? { _id: p.category.id, name: p.category.name, slug: slugOf(p.category.slug) } : undefined,
    tags: (p.tags ?? []).map((t) => t.name),
    description: tiptapToPortableText(p.description),
    shortDescription: p.shortDescription ?? undefined,
    inStock: (p.stock ?? 0) > 0,
    stockCount: p.stock ?? 0,
    rating: p.rating ?? undefined,
    reviewCount: p.reviewCount ?? 0,
    dealBadge: p.dealBadge ?? undefined,
    dealPercent: p.dealPercent ?? undefined,
    isFeatured: p.isFeatured,
    isBestSeller: p.isBestSeller,
    // Not part of the old Sanity schema — new CMS concept. Consumers that
    // read these type the product loosely (ProductClientInteractive etc).
    variants: (p.variants ?? []).map((v) => ({
      id: v.id,
      title: v.name,
      sku: v.sku ?? undefined,
      price: v.price ?? undefined,
      stockCount: v.stock ?? 0,
      images: v.image ? [mediaImage(v.image)] : [],
    })),
  }
  return normalized as unknown as Product
}

export const getAllProducts = async (params?: { featured?: boolean; page?: number; pageSize?: number }): Promise<Product[]> => {
  try {
    const qs = new URLSearchParams()
    if (params?.featured) qs.set('featured', 'true')
    if (params?.page) qs.set('page', String(params.page))
    if (params?.pageSize) qs.set('pageSize', String(params.pageSize))
    const path = `/api/cms/v1/products${qs.toString() ? `?${qs}` : ''}`
    const products = await cmsGet<RawProduct[]>(path, { revalidate: 60, tags: ['products'] })
    return (products ?? []).map(normProduct)
  } catch (e) { console.error('getAllProducts error:', e); return [] }
}

export const getProductBySlug = async (slug: string): Promise<Product | null> => {
  try {
    const p = await cmsGet<RawProduct>(`/api/cms/v1/products/${slug}`, { revalidate: 60, tags: [`product-${slug}`] })
    return normProduct(p)
  } catch (e) { console.error('getProductBySlug error:', e); return null }
}

export const getBestSellers = async (categorySlug?: string): Promise<Product[]> => {
  try {
    const qs = new URLSearchParams({ bestSellers: 'true' })
    if (categorySlug && categorySlug !== 'all') qs.set('category', categorySlug)
    const products = await cmsGet<RawProduct[]>(`/api/cms/v1/products?${qs}`, { revalidate: 120, tags: ['best-sellers'] })
    return (products ?? []).map(normProduct)
  } catch (e) { console.error('getBestSellers error:', e); return [] }
}

export const getDeals = async (params?: { page?: number; pageSize?: number }): Promise<Product[]> => {
  try {
    const qs = new URLSearchParams({ deals: 'true' })
    if (params?.page) qs.set('page', String(params.page))
    if (params?.pageSize) qs.set('pageSize', String(params.pageSize))
    const products = await cmsGet<RawProduct[]>(`/api/cms/v1/products?${qs}`, { revalidate: 60, tags: ['deals'] })
    return (products ?? []).map(normProduct)
  } catch (e) { console.error('getDeals error:', e); return [] }
}

export const getProductsByCategory = async (categorySlug: string): Promise<Product[]> => {
  try {
    const result = await cmsGet<{ products: RawProduct[]; category: unknown }>(
      `/api/cms/v1/categories/${categorySlug}`,
      { revalidate: 60, tags: [`category-${categorySlug}`] }
    )
    return (result?.products ?? []).map(normProduct)
  } catch (e) { console.error('getProductsByCategory error:', e); return [] }
}

export const searchProductsByName = async (searchParam: string, categorySlug?: string, tag?: string): Promise<Product[]> => {
  try {
    const q = searchParam?.trim()
    if (!q || q.length < 2) return []
    const qs = new URLSearchParams({ q })
    if (categorySlug && categorySlug !== 'all') qs.set('category', categorySlug)
    if (tag) qs.set('tag', tag)
    const products = await cmsGet<RawProduct[]>(`/api/cms/v1/search?${qs}`, { revalidate: 30 })
    return (products ?? []).map(normProduct)
  } catch (e) { console.error('searchProductsByName error:', e); return [] }
}

// ── Categories ────────────────────────────────────────────────────────────────

interface RawCategory {
  id: string
  slug: string
  name: string
  description: string | null
  image: RawMedia | null
  sortOrder: number
  createdAt: string
  updatedAt: string
  children?: RawCategory[]
}

function normCategory(c: RawCategory, parent?: RawCategory): Category {
  const normalized = {
    _id: c.id,
    _type: 'category',
    _createdAt: c.createdAt,
    _updatedAt: c.updatedAt,
    _rev: c.id,
    name: c.name,
    slug: slugOf(c.slug),
    description: c.description ?? undefined,
    image: mediaImage(c.image),
    // The old Sanity `CategoryReference` type only has `_ref`, but consumers
    // (FilterSidebar's "back to parent department" link) also read `name`/
    // `slug` off it — include them since we have the parent on hand here.
    parentCategory: parent
      ? { _id: parent.id, _ref: parent.id, _type: 'reference', name: parent.name, slug: slugOf(parent.slug) }
      : undefined,
    sortOrder: c.sortOrder,
  }
  return normalized as unknown as Category
}

// The API returns top-level categories with a nested `children` array; the
// storefront (DrawerMenu, FilterSidebar, Navbar) expects a flat list where
// each category carries its own `parentCategory` reference. Flatten here.
function flattenCategories(cats: RawCategory[]): Category[] {
  const out: Category[] = []
  for (const c of cats ?? []) {
    out.push(normCategory(c))
    for (const child of c.children ?? []) {
      out.push(normCategory(child, c))
    }
  }
  return out
}

export const getAllCategories = async (): Promise<Category[]> => {
  try {
    const categories = await cmsGet<RawCategory[]>('/api/cms/v1/categories', { revalidate: 300, tags: ['categories'] })
    return flattenCategories(categories)
  } catch (e) { console.error('getAllCategories error:', e); return [] }
}

// ── Brands ────────────────────────────────────────────────────────────────────

interface RawBrand {
  id: string
  slug: string
  name: string
  logo: RawMedia | null
  isAuthorisedReseller: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

function normBrand(b: RawBrand): Brand {
  const normalized = {
    _id: b.id,
    _type: 'brand',
    _createdAt: b.createdAt,
    _updatedAt: b.updatedAt,
    _rev: b.id,
    name: b.name,
    slug: slugOf(b.slug),
    logo: mediaImage(b.logo),
    isAuthorisedReseller: b.isAuthorisedReseller,
    sortOrder: b.sortOrder,
  }
  return normalized as unknown as Brand
}

export const getBrands = async (): Promise<Brand[]> => {
  try {
    const brands = await cmsGet<RawBrand[]>('/api/cms/v1/brands', { revalidate: 120, tags: ['brands'] })
    return (brands ?? []).map(normBrand)
  } catch (e) { console.error('getBrands error:', e); return [] }
}

// ── Hero Banners ──────────────────────────────────────────────────────────────

interface RawHeroBanner {
  id: string
  title: string
  subtitle: string | null
  badge: string | null
  bgColor: string
  ctaLabel: string | null
  ctaHref: string | null
  image: RawMedia | null
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

function normHeroBanner(b: RawHeroBanner): HeroBanner {
  const img = mediaImage(b.image)
  const normalized = {
    _id: b.id,
    _type: 'heroBanner',
    _createdAt: b.createdAt,
    _updatedAt: b.updatedAt,
    _rev: b.id,
    title: b.title,
    subtitle: b.subtitle ?? undefined,
    badge: b.badge ?? undefined,
    bgColor: b.bgColor,
    productImages: img ? [img] : [],
    ctaLabel: b.ctaLabel ?? undefined,
    ctaHref: b.ctaHref ?? undefined,
    isActive: b.isActive,
    sortOrder: b.sortOrder,
  }
  return normalized as unknown as HeroBanner
}

export const getHeroBanners = async (): Promise<HeroBanner[]> => {
  try {
    const banners = await cmsGet<RawHeroBanner[]>('/api/cms/v1/hero-banners', { revalidate: 60, tags: ['hero-banners'] })
    return (banners ?? []).map(normHeroBanner)
  } catch (e) { console.error('getHeroBanners error:', e); return [] }
}

// ── Homepage Sections ─────────────────────────────────────────────────────────

interface RawHomepageSectionItem {
  id: string
  label: string | null
  href: string | null
  image: RawMedia | null
}

interface RawHomepageSection {
  id: string
  title: string
  variant: string
  promoCode: string | null
  promoDiscount: string | null
  promoSubtext: string | null
  isActive: boolean
  sortOrder: number
  locale: string
  ctaLabel: string | null
  ctaHref: string | null
  items: RawHomepageSectionItem[]
  createdAt: string
  updatedAt: string
}

const KNOWN_VARIANTS = new Set(['grid', 'hero', 'promo', 'auth'])

// The CMS enum has extra variants (BRANDS, BEST_SELLERS, CAROUSEL) the
// storefront's ShopCard doesn't render yet — fall back to the generic card.
function normVariant(v: string): 'grid' | 'hero' | 'promo' | 'auth' {
  const lower = v.toLowerCase()
  return (KNOWN_VARIANTS.has(lower) ? lower : 'auth') as 'grid' | 'hero' | 'promo' | 'auth'
}

function normHomepageSection(s: RawHomepageSection): HomepageSection {
  const items = (s.items ?? []).map((it) => ({
    _key: it.id,
    label: it.label ?? undefined,
    href: it.href ?? undefined,
    image: mediaImage(it.image),
  }))
  const normalized = {
    _id: s.id,
    _type: 'homepageSection',
    _createdAt: s.createdAt,
    _updatedAt: s.updatedAt,
    _rev: s.id,
    title: s.title,
    variant: normVariant(s.variant),
    items,
    heroImage: items[0]?.image,
    cta: s.ctaLabel || s.ctaHref ? { label: s.ctaLabel ?? undefined, href: s.ctaHref ?? undefined } : undefined,
    promoCode: s.promoCode ?? undefined,
    promoDiscount: s.promoDiscount ?? undefined,
    promoSubtext: s.promoSubtext ?? undefined,
    isActive: s.isActive,
    sortOrder: s.sortOrder,
    locale: s.locale?.toLowerCase(),
  }
  return normalized as unknown as HomepageSection
}

export const getHomepageSections = async (locale?: 'ZA' | 'ZW'): Promise<HomepageSection[]> => {
  try {
    const qs = locale ? `?locale=${locale}` : ''
    const sections = await cmsGet<RawHomepageSection[]>(`/api/cms/v1/homepage${qs}`, { revalidate: 300, tags: ['homepage-sections'] })
    return (sections ?? []).map(normHomepageSection)
  } catch (e) { console.error('getHomepageSections error:', e); return [] }
}

// ── Sales / Coupons ───────────────────────────────────────────────────────────

export interface CmsSale {
  id: string
  title: string
  couponCode: string | null
  discountAmount: number // percentage
  description: string | null
  validUntil: string | null
  applicableProductIds: string[]
}

export const getActiveSaleByCouponCode = async (couponCode: string): Promise<CmsSale | null> => {
  try {
    return await cmsGet<CmsSale>(`/api/cms/v1/sales/${encodeURIComponent(couponCode)}`, { revalidate: 0 })
  } catch (e) {
    if (e instanceof CmsError && e.status === 404) return null
    console.error('getActiveSaleByCouponCode error:', e)
    return null
  }
}

// ── Orders ────────────────────────────────────────────────────────────────────

export interface CmsOrderItem {
  id: string
  productId: string | null
  variantId: string | null
  name: string
  sku: string | null
  price: number
  quantity: number
  image: string | null
}

export interface CmsOrder {
  id: string
  orderNumber: string
  status: string
  clerkUserId: string | null
  customerEmail: string
  customerName: string
  customerPhone: string | null
  shippingAddress: Record<string, string>
  subtotal: number
  discountAmount: number // currency amount
  shippingCost: number
  total: number
  currency: string
  couponCode: string | null
  paymentProvider: string
  paymentId: string | null
  orderDate: string
  updatedAt: string
  items: CmsOrderItem[]
}

export const getMyOrders = async (userId: string): Promise<CmsOrder[]> => {
  if (!userId) return []
  try {
    const result = await cmsGet<{ orders: CmsOrder[] }>(`/api/cms/v1/orders?userId=${userId}`, { revalidate: 0 })
    return result.orders ?? []
  } catch (e) { console.error('getMyOrders error:', e); return [] }
}

export const getOrder = async (orderNumber: string, userId: string): Promise<CmsOrder | null> => {
  if (!orderNumber || !userId) return null
  try {
    return await cmsGet<CmsOrder>(`/api/cms/v1/orders/${orderNumber}?userId=${userId}`, { revalidate: 0 })
  } catch (e) {
    if (e instanceof CmsError && (e.status === 404 || e.status === 403)) return null
    console.error('getOrder error:', e)
    return null
  }
}

// Guest order tracking: the CMS returns the order by number alone (no auth),
// so we verify the caller-supplied email matches before handing back any
// data — otherwise anyone who guesses an order number could see it.
export const trackOrder = async (orderNumber: string, email: string): Promise<CmsOrder | null> => {
  if (!orderNumber?.trim() || !email?.trim()) return null
  try {
    const order = await cmsGet<CmsOrder>(`/api/cms/v1/orders/${encodeURIComponent(orderNumber.trim())}`, { revalidate: 0 })
    if (order.customerEmail?.toLowerCase() !== email.trim().toLowerCase()) return null
    return order
  } catch (e) {
    if (e instanceof CmsError && e.status === 404) return null
    console.error('trackOrder error:', e)
    return null
  }
}

export const createOrder = async (order: {
  orderNumber: string
  customerEmail: string
  customerName: string
  customerPhone?: string
  clerkUserId?: string
  items: { productId?: string; name: string; sku?: string; quantity: number; price: number; image?: string }[]
  subtotal: number
  discountAmount?: number
  shippingCost?: number
  total: number
  currency?: string
  paymentProvider: string
  paymentId?: string
  couponCode?: string
  shippingAddress: Record<string, unknown>
}): Promise<CmsOrder> => {
  return cmsPost<CmsOrder>('/api/cms/v1/orders', order)
}

// ── Customer Addresses ────────────────────────────────────────────────────────

export interface CmsAddress {
  id: string
  _id: string // Sanity-compat alias of `id`
  clerkUserId: string
  fullName: string
  phone: string
  streetAddress: string
  buildingDetails: string | null
  suburb: string | null
  city: string
  province: string | null
  postalCode: string
  country: string
  isDefault: boolean
  addressType: string | null
  deliveryInstructions: string | null
}

function normAddress<T extends { id: string }>(a: T): T & { _id: string } {
  return { ...a, _id: a.id }
}

export const getAddressesByUser = async (clerkUserId: string): Promise<CmsAddress[]> => {
  if (!clerkUserId) return []
  try {
    const result = await cmsGet<{ addresses: CmsAddress[] }>(`/api/cms/v1/addresses?userId=${clerkUserId}`, { revalidate: 0 })
    return (result.addresses ?? []).map(normAddress)
  } catch (e) { console.error('getAddressesByUser error:', e); return [] }
}

export const getDefaultAddress = async (clerkUserId: string): Promise<CmsAddress | null> => {
  const addrs = await getAddressesByUser(clerkUserId)
  return addrs.find((a) => a.isDefault) ?? addrs[0] ?? null
}

// There is no public "get address by id" endpoint — only PATCH/DELETE by id.
// Fetch the user's addresses (which we must scope to a known clerkUserId
// anyway, to enforce ownership) and find the one requested.
export const getAddressById = async (id: string, clerkUserId: string): Promise<CmsAddress | null> => {
  const addrs = await getAddressesByUser(clerkUserId)
  return addrs.find((a) => a.id === id) ?? null
}

export const createAddress = async (data: Omit<CmsAddress, 'id' | '_id'>): Promise<string> => {
  const result = await cmsPost<CmsAddress>('/api/cms/v1/addresses', data)
  return result.id
}

export const updateAddress = async (id: string, data: Partial<Omit<CmsAddress, 'id' | '_id' | 'clerkUserId'>>): Promise<void> => {
  await cmsPatch(`/api/cms/v1/addresses/${id}`, data)
}

export const deleteAddress = async (id: string): Promise<void> => {
  await cmsDelete(`/api/cms/v1/addresses/${id}`)
}

export const setDefaultAddress = async (id: string, clerkUserId: string): Promise<void> => {
  await cmsPatch(`/api/cms/v1/addresses/${id}`, { isDefault: true, clerkUserId })
}

// ── Site Settings ─────────────────────────────────────────────────────────────

export const getSiteSetting = async (key: string): Promise<string | null> => {
  try {
    const result = await cmsGet<{ key: string; value: string }>(`/api/cms/v1/settings/${key}`, { revalidate: 300, tags: [`setting-${key}`] })
    return result.value ?? null
  } catch { return null }
}
