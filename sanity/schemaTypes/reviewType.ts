import { StarIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

export const reviewType = defineType({
  name: 'review',
  title: 'Reviews',
  type: 'document',
  icon: StarIcon,
  fields: [
    defineField({
      name: 'product',
      title: 'Product',
      type: 'reference',
      to: [{ type: 'product' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'clerkUserId',
      title: 'Clerk User ID',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'authorName',
      title: 'Author Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'rating',
      title: 'Rating',
      type: 'number',
      validation: (Rule) => Rule.required().min(1).max(5),
    }),
    defineField({
      name: 'title',
      title: 'Review Title',
      type: 'string',
      validation: (Rule) => Rule.required().min(2).max(100),
    }),
    defineField({
      name: 'body',
      title: 'Review Body',
      type: 'text',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'isVerifiedPurchase',
      title: 'Verified Purchase',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'helpfulVotes',
      title: 'Helpful Votes',
      type: 'number',
      initialValue: 0,
    }),
    defineField({
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      rating: 'rating',
      product: 'product.name',
    },
    prepare({ title, rating, product }) {
      return {
        title: `${rating}★ - ${title}`,
        subtitle: `On ${product}`,
      }
    }
  }
})
