import { TrolleyIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

export const productType = defineType({
    name: 'product',
    title: 'Products',
    type: 'document',
    icon: TrolleyIcon,
    fieldsets: [
        { name: 'pricing', title: 'Pricing & Valuation' },
        { name: 'deals', title: 'Deals & Promotions' },
    ],
    fields: [
        defineField({
            name: 'name',
            title: 'Product Name',
            type: 'string',
            validation: (Rule: any) => Rule.required().min(2).max(100),
        }),
        defineField({
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: {
                source: 'name',
                maxLength: 90,
            },
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'sku',
            title: 'SKU',
            type: 'string',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'images',
            title: 'Product Images',
            type: 'array',
            of: [
                {
                    type: 'image',
                    options: {
                        hotspot: true,
                    },
                }
            ],
            validation: (Rule) => Rule.required().min(1),
        }),
        defineField({
            name: 'price',
            title: 'Price (ZAR)',
            type: 'number',
            fieldset: 'pricing',
            description: 'The base selling price in South African Rand (ZAR)',
            validation: (Rule: any) => Rule.required().positive().precision(2).min(0),
        }),
        defineField({
            name: 'compareAtPrice',
            title: 'Compare At Price (ZAR)',
            type: 'number',
            fieldset: 'pricing',
            description: 'The original retail price for sale comparison display',
            validation: (Rule: any) => Rule.positive().precision(2).custom((value: any, context: any) => {
              if (value && context.document?.price && value <= context.document.price) {
                return 'Compare at price must be greater than the regular price';
              }
              return true;
            }),
        }),
        defineField({
            name: 'brand',
            title: 'Brand',
            type: 'reference',
            to: [{ type: 'brand' }],
        }),
        defineField({
            name: 'category',
            title: 'Category',
            type: 'reference',
            to: [{ type: 'category' }],
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'tags',
            title: 'Tags',
            type: 'array',
            of: [{ type: 'string' }],
        }),
        defineField({
            name: 'description',
            title: 'Description',
            type: 'blockContent',
        }),
        defineField({
            name: 'inStock',
            title: 'In Stock',
            type: 'boolean',
            initialValue: true,
        }),
        defineField({
            name: 'stockCount',
            title: 'Stock Count',
            type: 'number',
            validation: (Rule: any) => Rule.required().min(0),
        }),
        defineField({
            name: 'variants',
            title: 'Product Variants',
            type: 'array',
            of: [{ type: 'productVariant' }],
            description: 'Optional variations of this product (size, color, etc.)',
        }),
        defineField({
            name: 'rating',
            title: 'Average Rating',
            type: 'number',
            validation: (Rule) => Rule.min(0).max(5),
        }),
        defineField({
            name: 'reviewCount',
            title: 'Review Count',
            type: 'number',
            validation: (Rule) => Rule.min(0),
        }),
        defineField({
            name: 'dealBadge',
            title: 'Deal Badge',
            type: 'string',
            fieldset: 'deals',
            options: {
                list: [
                    { title: 'Limited Time Deal', value: 'limited-time' },
                    { title: 'Percent Off', value: 'percent-off' },
                    { title: 'New Arrival', value: 'new' },
                ]
            }
        }),
        defineField({
            name: 'dealPercent',
            title: 'Deal Percentage',
            type: 'number',
            fieldset: 'deals',
            validation: (Rule) => Rule.min(0).max(100),
        }),
        defineField({
            name: 'isFeatured',
            title: 'Featured Product',
            type: 'boolean',
            initialValue: false,
        }),
        defineField({
            name: 'isBestSeller',
            title: 'Best Seller',
            type: 'boolean',
            initialValue: false,
        }),
    ],
    preview: {
        select: {
            title: 'name',
            images: 'images',
            subtitle: 'price',
        },
        prepare: (select) => {
            const { title, images, subtitle } = select;
            return {
                title: title,
                media: images && images.length > 0 ? images[0] : null,
                subtitle: `R ${subtitle}`,
            };
        },
    },
})