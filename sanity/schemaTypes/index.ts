import { type SchemaTypeDefinition } from 'sanity'

import { blockContentType } from './blockContentType'
import { categoryType } from './categoryType'
import { productType } from './poductType'
import { orderType } from './orderType'
import { salesType } from './salesType'
import { brandType } from './brandType'
import { heroBannerType } from './heroBannerType'
import { homepageSectionType } from './homepageSectionType'
import { dealType } from './dealType'
import { siteSettingsType } from './siteSettingsType'
import { customerAddressType } from './customerAddressType'
import { productVariantType } from './productVariantType'
import { reviewType } from './reviewType'
import { wishlistType } from './wishlistType'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    blockContentType,
    categoryType,
    productVariantType,
    productType,
    orderType,
    salesType,
    brandType,
    heroBannerType,
    homepageSectionType,
    dealType,
    siteSettingsType,
    customerAddressType,
    reviewType,
    wishlistType,
  ],
}
