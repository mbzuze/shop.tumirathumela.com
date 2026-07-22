/**
 * Storefront-facing content types, matching the legacy Sanity document shape
 * that `lib/cms-client.ts`'s adapters normalize TumiraCMS API responses into.
 * Replaces the old Sanity-typegen `sanity.types.ts`.
 */

export type CmsImageAssetReference = {
  _ref: string;
  _type: "reference";
  _weak?: boolean;
};

export type CmsImageCrop = {
  _type: "sanity.imageCrop";
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
};

export type CmsImageHotspot = {
  _type: "sanity.imageHotspot";
  x?: number;
  y?: number;
  height?: number;
  width?: number;
};

type CmsImage = {
  asset?: CmsImageAssetReference;
  media?: unknown;
  hotspot?: CmsImageHotspot;
  crop?: CmsImageCrop;
  _type: "image";
};

export type Slug = {
  _type: "slug";
  current?: string;
  source?: string;
};

export type CmsBrandReference = {
  _ref: string;
  _type: "reference";
  _weak?: boolean;
};

export type CmsCategoryReference = {
  _ref: string;
  _type: "reference";
  _weak?: boolean;
};

export type CmsBlockContent = Array<
  | {
      children?: Array<{
        marks?: Array<string>;
        text?: string;
        _type: "span";
        _key: string;
      }>;
      style?: "normal" | "h1" | "h2" | "h3" | "h4" | "blockquote";
      listItem?: "bullet";
      markDefs?: Array<{
        href?: string;
        _type: "link";
        _key: string;
      }>;
      level?: number;
      _type: "block";
      _key: string;
    }
  | (CmsImage & { alt?: string; _key: string })
>;

export type Product = {
  _id: string;
  _type: "product";
  _createdAt: string;
  _updatedAt: string;
  _rev: string;
  name?: string;
  slug?: Slug;
  sku?: string;
  images?: Array<CmsImage & { _key: string }>;
  price?: number;
  compareAtPrice?: number;
  brand?: CmsBrandReference;
  category?: CmsCategoryReference;
  tags?: Array<string>;
  description?: CmsBlockContent;
  inStock?: boolean;
  stockCount?: number;
  rating?: number;
  reviewCount?: number;
  dealBadge?: "limited-time" | "percent-off" | "new";
  dealPercent?: number;
  isFeatured?: boolean;
  isBestSeller?: boolean;
};

export type Brand = {
  _id: string;
  _type: "brand";
  _createdAt: string;
  _updatedAt: string;
  _rev: string;
  name?: string;
  slug?: Slug;
  logo?: CmsImage;
  isAuthorisedReseller?: boolean;
  sortOrder?: number;
};

export type Category = {
  _id: string;
  _type: "category";
  _createdAt: string;
  _updatedAt: string;
  _rev: string;
  name?: string;
  slug?: Slug;
  description?: string;
  image?: CmsImage;
  parentCategory?: CmsCategoryReference;
  sortOrder?: number;
};

export type HeroBanner = {
  _id: string;
  _type: "heroBanner";
  _createdAt: string;
  _updatedAt: string;
  _rev: string;
  title?: string;
  subtitle?: string;
  badge?: string;
  bgColor?: string;
  productImages?: Array<CmsImage & { _key: string }>;
  ctaLabel?: string;
  ctaHref?: string;
  isActive?: boolean;
  sortOrder?: number;
};

export type HomepageSection = {
  _id: string;
  _type: "homepageSection";
  _createdAt: string;
  _updatedAt: string;
  _rev: string;
  title?: string;
  variant?: "grid" | "hero" | "promo" | "auth";
  items?: Array<{
    label?: string;
    image?: CmsImage;
    href?: string;
    _key: string;
  }>;
  heroImage?: CmsImage;
  cta?: {
    label?: string;
    href?: string;
  };
  promoCode?: string;
  promoDiscount?: string;
  promoSubtext?: string;
  isActive?: boolean;
  sortOrder?: number;
  locale?: "za" | "zw" | "both";
};
