import type { JSONContent } from '@tiptap/core'

export type { JSONContent }

// ─── ENUMS ────────────────────────────────────────────────────────────────────

export type DocumentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
export type MediaType = 'IMAGE' | 'VIDEO' | 'DOCUMENT'
export type OrderStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED'
export type PaymentProvider = 'YOCO' | 'PAYFAST' | 'MANUAL'
export type AddressType = 'HOME' | 'BUSINESS' | 'OTHER'
export type Locale = 'ZA' | 'ZW' | 'BOTH'
export type HomepageSectionVariant = 'FEATURED_PRODUCTS' | 'COLLECTION_GRID' | 'BANNER_ROW' | 'PROMO_TILES' | 'TESTIMONIALS' | 'BRANDS' | 'TEXT_BANNER'
export type SaleDiscountType = 'PERCENTAGE' | 'FIXED'

// ─── PAGINATION ───────────────────────────────────────────────────────────────

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface ApiSuccessResponse<T> {
  success: true
  data: T
  meta?: PaginationMeta
}

export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

// ─── MEDIA ────────────────────────────────────────────────────────────────────

export interface MediaFolderDto {
  id: string
  name: string
  parentId: string | null
  children: MediaFolderDto[]
  createdAt: string
}

export interface MediaDto {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  width: number | null
  height: number | null
  diskPath: string
  publicUrl: string
  thumbPath: string | null
  thumbUrl: string | null
  altText: string | null
  type: MediaType
  folderId: string | null
  folder: Pick<MediaFolderDto, 'id' | 'name'> | null
  uploadedBy: string
  createdAt: string
}

// ─── CATEGORY ─────────────────────────────────────────────────────────────────

export interface CategoryDto {
  id: string
  slug: string
  name: string
  description: string | null
  parentId: string | null
  parent: Pick<CategoryDto, 'id' | 'name' | 'slug'> | null
  children: CategoryDto[]
  image: MediaDto | null
  seoTitle: string | null
  seoDescription: string | null
  sortOrder: number
  isActive: boolean
  _count?: { products: number }
  createdAt: string
  updatedAt: string
}

// ─── BRAND ────────────────────────────────────────────────────────────────────

export interface BrandDto {
  id: string
  slug: string
  name: string
  description: string | null
  logo: MediaDto | null
  isAuthorisedReseller: boolean
  website: string | null
  sortOrder: number
  isActive: boolean
  _count?: { products: number }
  createdAt: string
  updatedAt: string
}

// ─── TAG ──────────────────────────────────────────────────────────────────────

export interface TagDto {
  id: string
  name: string
  slug: string
}

// ─── PRODUCT ──────────────────────────────────────────────────────────────────

export interface ProductVariantOption {
  name: string
  value: string
}

export interface ProductVariantDto {
  id: string
  productId: string
  name: string
  options: ProductVariantOption[]
  sku: string | null
  price: number | null
  stock: number
  image: MediaDto | null
  createdAt: string
  updatedAt: string
}

export interface ProductImageDto {
  id: string
  mediaId: string
  media: MediaDto
  altText: string | null
  position: number
}

export interface ProductDto {
  id: string
  slug: string
  status: DocumentStatus
  name: string
  description: JSONContent
  draftContent: JSONContent | null
  shortDescription: string | null
  price: number
  compareAtPrice: number | null
  sku: string | null
  stock: number
  isActive: boolean
  isFeatured: boolean
  isBestSeller: boolean
  weight: number | null
  seoTitle: string | null
  seoDescription: string | null
  dealBadge: string | null
  dealPercent: number | null
  rating: number | null
  reviewCount: number
  category: Pick<CategoryDto, 'id' | 'name' | 'slug'> | null
  brand: Pick<BrandDto, 'id' | 'name' | 'slug'> | null
  images: ProductImageDto[]
  variants: ProductVariantDto[]
  tags: TagDto[]
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
}

export interface ProductRevisionDto {
  id: string
  productId: string
  snapshot: ProductDto
  createdBy: string
  createdAt: string
}

// ─── COLLECTION ───────────────────────────────────────────────────────────────

export interface CollectionProductDto {
  productId: string
  position: number
  product: Pick<ProductDto, 'id' | 'name' | 'slug' | 'price' | 'images' | 'status'>
}

export interface CollectionDto {
  id: string
  slug: string
  name: string
  description: JSONContent | null
  image: MediaDto | null
  status: DocumentStatus
  seoTitle: string | null
  seoDescription: string | null
  products: CollectionProductDto[]
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

// ─── REVIEW ───────────────────────────────────────────────────────────────────

export interface ReviewDto {
  id: string
  productId: string
  product: Pick<ProductDto, 'id' | 'name' | 'slug'> | null
  clerkUserId: string
  authorName: string
  rating: number
  title: string | null
  body: string
  isVerifiedPurchase: boolean
  helpfulVotes: number
  isApproved: boolean
  createdAt: string
  updatedAt: string
}

// ─── ORDER ────────────────────────────────────────────────────────────────────

export interface OrderItemDto {
  id: string
  productId: string | null
  variantId: string | null
  name: string
  sku: string | null
  price: number
  quantity: number
  image: string | null
  options: ProductVariantOption[] | null
}

export interface ShippingAddress {
  fullName: string
  phone?: string
  streetAddress: string
  buildingDetails?: string
  suburb?: string
  city: string
  province?: string
  postalCode?: string
  country: string
}

export interface OrderDto {
  id: string
  orderNumber: string
  status: OrderStatus
  clerkUserId: string
  customerName: string
  customerEmail: string
  customerPhone: string | null
  shippingAddress: ShippingAddress
  subtotal: number
  discountAmount: number
  shippingCost: number
  total: number
  currency: string
  couponCode: string | null
  notes: string | null
  paymentProvider: PaymentProvider
  paymentId: string | null
  paidAt: string | null
  items: OrderItemDto[]
  orderDate: string
  updatedAt: string
}

// ─── WISHLIST ─────────────────────────────────────────────────────────────────

export interface WishlistItemDto {
  id: string
  clerkUserId: string
  product: Pick<ProductDto, 'id' | 'name' | 'slug' | 'price' | 'images'>
  variantId: string | null
  notes: string | null
  addedAt: string
}

// ─── CUSTOMER ADDRESS ─────────────────────────────────────────────────────────

export interface CustomerAddressDto {
  id: string
  clerkUserId: string
  fullName: string
  phone: string | null
  streetAddress: string
  buildingDetails: string | null
  suburb: string | null
  city: string
  province: string | null
  postalCode: string | null
  country: string
  isDefault: boolean
  addressType: AddressType
  deliveryInstructions: string | null
  createdAt: string
  updatedAt: string
}

// ─── SALE / COUPON ────────────────────────────────────────────────────────────

export interface SaleDto {
  id: string
  name: string
  couponCode: string
  discountType: SaleDiscountType
  discountValue: number
  minimumOrderValue: number | null
  description: string | null
  startsAt: string | null
  endsAt: string | null
  isActive: boolean
  usageLimit: number | null
  usageCount: number
  products: Pick<ProductDto, 'id' | 'name' | 'slug'>[]
  createdAt: string
  updatedAt: string
}

// ─── HERO BANNER ──────────────────────────────────────────────────────────────

export interface HeroBannerDto {
  id: string
  title: string
  subtitle: string | null
  badge: string | null
  bgColor: string
  ctaText: string | null
  ctaUrl: string | null
  overlayOpacity: number
  textColor: string
  startsAt: string | null
  endsAt: string | null
  media: MediaDto | null
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

// ─── HOMEPAGE SECTION ─────────────────────────────────────────────────────────

export interface HomepageSectionItemDto {
  id: string
  media: MediaDto | null
  title: string | null
  subtitle: string | null
  linkUrl: string | null
  linkText: string | null
  referenceId: string | null
  referenceType: string | null
  sortOrder: number
}

export interface HomepageSectionDto {
  id: string
  title: string
  variant: HomepageSectionVariant
  promoCode: string | null
  promoDiscount: string | null
  promoSubtext: string | null
  isActive: boolean
  sortOrder: number
  locale: Locale
  ctaLabel: string | null
  ctaHref: string | null
  items: HomepageSectionItemDto[]
  createdAt: string
  updatedAt: string
}

// ─── SITE SETTINGS ────────────────────────────────────────────────────────────

export interface SiteSettingsDto {
  id: string
  key: string
  value: unknown
  updatedBy: string
  updatedAt: string
}

// ─── WEBHOOK ──────────────────────────────────────────────────────────────────

export interface WebhookDto {
  id: string
  name: string
  url: string
  events: string[]
  isActive: boolean
  createdAt: string
}

export interface WebhookLogDto {
  id: string
  webhookId: string
  event: string
  payload: unknown
  statusCode: number | null
  response: string | null
  success: boolean
  createdAt: string
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

export interface DashboardStats {
  products: { total: number; published: number; drafts: number; archived: number }
  orders: { total: number; pending: number; completed: number; revenue: number }
  media: { total: number; diskUsageBytes: number }
  categories: number
  brands: number
  reviews: { total: number; pending: number }
}

// ─── FORM INPUT TYPES ─────────────────────────────────────────────────────────

export interface CreateProductInput {
  name: string
  slug: string
  description: JSONContent
  shortDescription?: string
  price: number
  compareAtPrice?: number
  sku?: string
  stock: number
  isActive: boolean
  isFeatured: boolean
  isBestSeller: boolean
  weight?: number
  seoTitle?: string
  seoDescription?: string
  dealBadge?: string
  dealPercent?: number
  categoryId?: string
  brandId?: string
  tagIds?: string[]
  imageIds?: Array<{ mediaId: string; altText?: string; position: number }>
  variants?: Array<{
    name: string
    options: ProductVariantOption[]
    sku?: string
    price?: number
    stock: number
    imageId?: string
  }>
}

export type UpdateProductInput = Partial<CreateProductInput>

export interface CreateCategoryInput {
  name: string
  slug: string
  description?: string
  parentId?: string
  imageId?: string
  seoTitle?: string
  seoDescription?: string
  sortOrder?: number
  isActive?: boolean
}

export interface CreateBrandInput {
  name: string
  slug: string
  description?: string
  logoId?: string
  isAuthorisedReseller?: boolean
  website?: string
  sortOrder?: number
  isActive?: boolean
}

export interface CreateCollectionInput {
  name: string
  slug: string
  description?: JSONContent
  imageId?: string
  seoTitle?: string
  seoDescription?: string
}

export interface CreateSaleInput {
  name: string
  couponCode: string
  discountType?: SaleDiscountType
  discountValue: number
  minimumOrderValue?: number
  description?: string
  startsAt?: string
  endsAt?: string
  isActive?: boolean
  usageLimit?: number
  productIds?: string[]
}

export interface CreateWebhookInput {
  name: string
  url: string
  secret: string
  events: string[]
}
