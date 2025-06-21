import { TrolleyIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

export const productType = defineType({
    name: 'product',
    title: 'Products',
    type: 'document',
    icon: TrolleyIcon,
    fields: [
        defineField({
            name: 'name',
            title: 'Product Name',
            type: 'string',
            validation: (Rule: any) => Rule.required().min(2).max(50),
        }),
        defineField({
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: {
                source: 'name',
                maxLength: 90,
            },
        }),
        defineField({
            name: 'image',
            title: 'Product image',
            type: 'image',
            options: {
                hotspot: true,
            },
        }),
        defineField({
            name: 'price',
            title: 'Price',
            type: 'number',
            validation: (Rule: any) => Rule.required().positive().precision(2).min(0),
        }),
        defineField({
            name: 'description',
            title: 'Description',
            type: 'blockContent',
        }),
        defineField({
            name: 'category',
            title: 'Category',
            type: 'array',
            of: [{ type: 'reference', to: { type: 'category' } }],
        }),
        defineField({
            name: 'inStock',
            title: 'In Stock',
            type: 'boolean',
            initialValue: true,
        }),
        defineField({
            name: 'quantity',
            title: 'Quantity in Stock',
            type: 'number',
            validation: (Rule: any) => Rule.required().min(0),
        }),
    ],
    preview: {
        select: {
            title: 'name',
            media: 'image',
            subtitle: 'price',
        },
        prepare: (select) => {
            const { title, media, subtitle } = select;
            return {
                title: title,
                media: media && media.length > 0 ? media[0] : null,
                subtitle: `${subtitle}`,
            };
        },
    },
})