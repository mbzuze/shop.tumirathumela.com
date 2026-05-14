import { DashboardIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

export const homepageSectionType = defineType({
  name: 'homepageSection',
  title: 'Homepage Section',
  type: 'document',
  icon: DashboardIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Section Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'variant',
      title: 'Layout Variant',
      type: 'string',
      options: {
        list: [
          { title: '2x2 Image Grid', value: 'grid' },
          { title: 'Single Hero Image', value: 'hero' },
          { title: 'Promo Card with Code Pill', value: 'promo' },
          { title: 'Auth Sign-in CTA', value: 'auth' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'items',
      title: 'Sub-items (For 2x2 Grid)',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'label', type: 'string', validation: (Rule) => Rule.required() },
            { name: 'image', type: 'image', options: { hotspot: true }, validation: (Rule) => Rule.required() },
            { name: 'href', type: 'string', validation: (Rule) => Rule.required() },
          ],
        },
      ],
      validation: (Rule) => Rule.custom((value, context) => {
        if (context.document?.variant === 'grid' && (!value || value.length === 0)) {
          return 'Grid variant requires sub-items';
        }
        return true;
      }),
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero Image (For Single Hero Variant)',
      type: 'image',
      options: { hotspot: true },
      validation: (Rule) => Rule.custom((value, context) => {
        if (context.document?.variant === 'hero' && !value) {
          return 'Hero variant requires a hero image';
        }
        return true;
      }),
    }),
    defineField({
      name: 'cta',
      title: 'CTA Link (For Grid / Hero Variants)',
      type: 'object',
      fields: [
        { name: 'label', type: 'string' },
        { name: 'href', type: 'string' },
      ],
    }),
    defineField({
      name: 'promoCode',
      title: 'Promo Code (For Promo Variant)',
      type: 'string',
    }),
    defineField({
      name: 'promoDiscount',
      title: 'Promo Discount Copy (For Promo Variant)',
      type: 'string',
      description: 'e.g. "Get 15% off"',
    }),
    defineField({
      name: 'promoSubtext',
      title: 'Promo Subtext (For Promo Variant)',
      type: 'string',
      description: 'e.g. "No minimum spend."',
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
    defineField({
      name: 'locale',
      title: 'Target Locale',
      type: 'string',
      initialValue: 'both',
      options: {
        list: [
          { title: 'South Africa 🇿🇦', value: 'za' },
          { title: 'Zimbabwe 🇿🇼', value: 'zw' },
          { title: 'Both Locales', value: 'both' },
        ],
      },
    }),
  ],
  preview: {
    select: {
      title: 'title',
      variant: 'variant',
      locale: 'locale',
      isActive: 'isActive',
    },
    prepare(select) {
      const { title, variant, locale, isActive } = select;
      const localeEmoji = locale === 'za' ? '🇿🇦' : locale === 'zw' ? '🇿🇼' : '🌎';
      return {
        title,
        subtitle: `[${variant?.toUpperCase()}] ${localeEmoji} - ${isActive ? 'Active' : 'Inactive'}`,
      };
    },
  },
});
