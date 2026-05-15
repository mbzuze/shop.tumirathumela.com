import { HeartIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

export const wishlistType = defineType({
  name: 'wishlist',
  title: 'Wishlists',
  type: 'document',
  icon: HeartIcon,
  fields: [
    defineField({
      name: 'clerkUserId',
      title: 'Clerk User ID',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'product',
      title: 'Product',
      type: 'reference',
      to: [{ type: 'product' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'variantId',
      title: 'Variant ID',
      type: 'string',
      description: 'Optional specific variant SKU or ID'
    }),
    defineField({
      name: 'addedAt',
      title: 'Added At',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'notes',
      title: 'Notes',
      type: 'string',
    }),
  ],
  preview: {
    select: {
      user: 'clerkUserId',
      product: 'product.name',
    },
    prepare({ user, product }) {
      return {
        title: product,
        subtitle: `User: ${user}`,
      }
    }
  }
})
