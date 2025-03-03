import { TagIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

export const salesType = defineType({
    name: 'sale',
    title: 'Sale',
    type: 'document',
    icon: TagIcon,
    fields: [
        defineField({
            name: 'title',
            title: 'Sale Title',
            type: 'string',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'discountAmount',
            title: 'Discount Amount',
            type: 'number',
            description: 'Enter the discount amount in percentage or fixed value.',
            validation: (Rule) => Rule.required().positive(),
        }),

        defineField({
            name: 'description',
            title: 'Sale Description',
            type: 'text',
        }),
        defineField({
            name: 'products',
            title: 'Products',
            type: 'array',
            of: [{ type: 'reference', to: [{ type: 'product' }] }],
        }),
        defineField({
            name: 'notes',
            title: 'Notes',
            type: 'text',
        }),
        defineField({
            name: 'couponCode',
            title: 'Coupon Code',
            type: 'string',
        }),
        defineField({
            name: 'validFrom',
            title: 'Valid From',
            type: 'datetime',
        }),
        defineField({
            name: 'validUntil',
            title: 'Valid Until',
            type: 'datetime',
        }),
        defineField({
            name: 'isActive',
            title: 'Is Active',
            type: 'boolean',
            initialValue: true,
            description: 'Check this box to activate the sale.',
        }),
    ],
    preview: {
        select: {
            title: 'title',
            couponCode: 'couponCode',
            discountAmount: 'discountAmount',
            isActive: 'isActive',
        },
        prepare(select) {
            const { title, couponCode, discountAmount, isActive } = select;
            const status = isActive ? 'Active' : 'Inactive';
            return {
                title: title,
                subtitle: `${discountAmount}% off - Code: ${couponCode} - ${status}`,
            };
        },
    },
});
