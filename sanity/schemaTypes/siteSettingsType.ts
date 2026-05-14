import { CogIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

export const siteSettingsType = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  icon: CogIcon,
  // Limit to single document creation/deletion using structure builders, but let's define the fields
  fields: [
    defineField({
      name: 'siteName',
      title: 'Site Name',
      type: 'string',
      initialValue: 'TumiraThumela',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'logo',
      title: 'Site Logo',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'favicon',
      title: 'Favicon Monogram',
      type: 'image',
    }),
    defineField({
      name: 'welcomeCode',
      title: 'Welcome Discount Code',
      type: 'string',
      initialValue: 'WELCOME15',
    }),
    defineField({
      name: 'welcomeDiscount',
      title: 'Welcome Discount Percent (%)',
      type: 'number',
      initialValue: 15,
      validation: (Rule) => Rule.min(0).max(100),
    }),
    defineField({
      name: 'defaultCurrency',
      title: 'Default Currency',
      type: 'string',
      initialValue: 'ZAR',
      options: {
        list: ['ZAR', 'USD'],
      },
    }),
    defineField({
      name: 'announcementBanner',
      title: 'Global Announcement Banner Text',
      type: 'string',
      description: 'Optional top-bar notification text',
    }),
  ],
  preview: {
    select: {
      title: 'siteName',
      welcomeCode: 'welcomeCode',
      welcomeDiscount: 'welcomeDiscount',
    },
    prepare(select) {
      const { title, welcomeCode, welcomeDiscount } = select;
      return {
        title: title || 'Global Site Settings',
        subtitle: welcomeCode ? `Default Promo: ${welcomeCode} (${welcomeDiscount}%)` : '',
      };
    },
  },
});
