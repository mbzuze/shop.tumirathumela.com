import { TagIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

export const dealType = defineType({
  name: 'deal',
  title: 'Deal',
  type: 'document',
  icon: TagIcon,
  fields: [
    defineField({
      name: 'product',
      title: 'Target Product',
      type: 'reference',
      to: [{ type: 'product' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'discountType',
      title: 'Discount Type',
      type: 'string',
      options: {
        list: [
          { title: 'Percentage (%)', value: 'percent' },
          { title: 'Fixed Amount (ZAR)', value: 'fixed' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'discountValue',
      title: 'Discount Value',
      type: 'number',
      validation: (Rule) => Rule.required().positive(),
    }),
    defineField({
      name: 'badgeLabel',
      title: 'Badge Label override',
      type: 'string',
      description: 'e.g. "Limited Time Deal", "Prime Savings"',
    }),
    defineField({
      name: 'startsAt',
      title: 'Starts At',
      type: 'datetime',
    }),
    defineField({
      name: 'endsAt',
      title: 'Ends At',
      type: 'datetime',
    }),
    defineField({
      name: 'isActive',
      title: 'Is Active',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      productName: 'product.name',
      discountType: 'discountType',
      discountValue: 'discountValue',
      isActive: 'isActive',
    },
    prepare(select) {
      const { productName, discountType, discountValue, isActive } = select;
      const formattedDiscount = discountType === 'percent' ? `${discountValue}% off` : `R ${discountValue} off`;
      return {
        title: productName ? `Deal: ${productName}` : 'Unnamed Deal',
        subtitle: `${formattedDiscount} - ${isActive ? 'Active ⚡' : 'Inactive'}`,
      };
    },
  },
});
