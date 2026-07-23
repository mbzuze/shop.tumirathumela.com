import { z } from 'zod'

export const CreateProductSchema = z.object({
  name: z.string().min(1).max(500),
  slug: z.string().min(1).max(500).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.record(z.unknown()),
  shortDescription: z.string().max(500).optional(),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  sku: z.string().max(100).optional(),
  stock: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  weight: z.number().positive().optional(),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(165).optional(),
  dealBadge: z.string().max(50).optional(),
  dealPercent: z.number().int().min(0).max(100).optional(),
  categoryId: z.string().cuid().optional(),
  brandId: z.string().cuid().optional(),
  tagIds: z.array(z.string().cuid()).optional(),
  imageIds: z.array(z.object({
    mediaId: z.string().cuid(),
    altText: z.string().max(300).optional(),
    position: z.number().int().min(0),
  })).optional(),
  variants: z.array(z.object({
    name: z.string().min(1).max(200),
    options: z.array(z.object({ name: z.string(), value: z.string() })),
    sku: z.string().max(100).optional(),
    price: z.number().positive().optional(),
    stock: z.number().int().min(0).default(0),
    imageId: z.string().cuid().optional(),
  })).optional(),
})

export const UpdateProductSchema = CreateProductSchema.partial()

export const CreateCategorySchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().max(2000).optional(),
  parentId: z.string().cuid().optional(),
  imageId: z.string().cuid().optional(),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(165).optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
})

export const UpdateCategorySchema = CreateCategorySchema.partial()

export const CreateBrandSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().max(2000).optional(),
  logoId: z.string().cuid().optional(),
  isAuthorisedReseller: z.boolean().default(false),
  website: z.string().url().optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
})

export const UpdateBrandSchema = CreateBrandSchema.partial()

export const CreateCollectionSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.record(z.unknown()).optional(),
  imageId: z.string().cuid().optional(),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(165).optional(),
  publish: z.boolean().optional(),
  productIds: z.array(z.string().cuid()).optional(),
})

export const UpdateCollectionSchema = CreateCollectionSchema.partial()

export const CreateSaleSchema = z.object({
  name: z.string().min(1).max(200),
  couponCode: z.string().min(3).max(50).toUpperCase(),
  discountType: z.enum(['PERCENTAGE', 'FIXED']).default('PERCENTAGE'),
  discountValue: z.number().positive(),
  minimumOrderValue: z.number().positive().optional(),
  description: z.string().max(500).optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
  usageLimit: z.number().int().positive().optional(),
  productIds: z.array(z.string().cuid()).optional(),
})

export const UpdateSaleSchema = CreateSaleSchema.partial()

export const CreateWebhookSchema = z.object({
  name: z.string().min(1).max(200),
  url: z.string().url(),
  secret: z.string().min(16),
  events: z.array(z.string()).min(1),
})

export const UpdateWebhookSchema = CreateWebhookSchema.partial()

export const CreateHeroBannerSchema = z.object({
  title: z.string().min(1).max(300),
  subtitle: z.string().max(500).optional(),
  ctaText: z.string().max(100).optional(),
  ctaUrl: z.string().max(500).optional(),
  overlayOpacity: z.number().int().min(0).max(100).default(40),
  textColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#ffffff'),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  mediaId: z.string().cuid().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
})

export const UpdateHeroBannerSchema = CreateHeroBannerSchema.partial()

export const CreateHomepageSectionSchema = z.object({
  title: z.string().min(1).max(300),
  variant: z.enum(['FEATURED_PRODUCTS', 'COLLECTION_GRID', 'BANNER_ROW', 'PROMO_TILES', 'TESTIMONIALS', 'BRANDS', 'TEXT_BANNER']),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
  locale: z.enum(['ZA', 'ZW', 'BOTH']).default('BOTH'),
  items: z.array(z.object({
    id: z.string().optional(),
    title: z.string().max(200).nullable().optional(),
    subtitle: z.string().max(300).nullable().optional(),
    linkUrl: z.string().max(500).nullable().optional(),
    linkText: z.string().max(100).nullable().optional(),
    sortOrder: z.number().int().min(0).optional(),
    referenceId: z.string().nullable().optional(),
    referenceType: z.string().nullable().optional(),
    mediaId: z.string().cuid().nullable().optional(),
  })).optional(),
})

export const UpdateHomepageSectionSchema = CreateHomepageSectionSchema.partial()

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'REFUNDED']),
  notes: z.string().max(1000).optional(),
})

export const UpdateReviewSchema = z.object({
  isApproved: z.boolean().optional(),
  helpfulVotes: z.number().int().min(0).optional(),
})

export const SettingsValueSchema = z.object({
  value: z.unknown(),
})

export const CMS_ROLES = ['admin', 'editor', 'viewer'] as const

export const UpdateUserRoleSchema = z.object({
  role: z.enum(CMS_ROLES),
})

export const CreateInvitationSchema = z.object({
  emailAddress: z.string().email(),
  role: z.enum(CMS_ROLES),
})
