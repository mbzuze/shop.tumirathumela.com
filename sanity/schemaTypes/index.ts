import { type SchemaTypeDefinition } from 'sanity'

import { blockContentType } from './blockContentType'
import { categoryType } from './categoryType'
import { productType } from './poductType'
import { orderType } from './orderType'
import { salesType } from './salesType'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [blockContentType, categoryType, orderType, productType, salesType],
}
