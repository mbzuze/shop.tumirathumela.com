import { ImagesIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

export const heroBannerType = defineType({
  name: 'heroBanner',
  title: 'Hero Banner',
  type: 'document',
  icon: ImagesIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Banner Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      type: 'string',
    }),
    defineField({
      name: 'badge',
      title: 'Badge Text',
      type: 'string',
      description: 'e.g. "Low Prices" or "Limited Offer"',
    }),
    defineField({
      name: 'bgColor',
      title: 'Background Color (Hex)',
      type: 'string',
      initialValue: '#EAEDED',
      validation: (Rule) => Rule.required().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, { name: 'hex' }),
    }),
    defineField({
      name: 'productImages',
      title: 'Product Images to Overlay',
      type: 'array',
      of: [{ type: 'image' }],
    }),
    defineField({
      name: 'ctaLabel',
      title: 'CTA Button Label',
      type: 'string',
      initialValue: 'Shop now',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'ctaHref',
      title: 'CTA Link Destination',
      type: 'string',
      initialValue: '#',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'isActive',
      title: 'Is Active',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'sortOrder',
      title: 'Sort Order',
      type: 'number',
      initialValue: 0,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'subtitle',
      isActive: 'isActive',
    },
    prepare(select) {
      const { title, subtitle, isActive } = select;
      return {
        title,
        subtitle: `${isActive ? 'Active' : 'Inactive'} - ${subtitle || ''}`,
      };
    },
  },
});
