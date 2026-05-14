import { CaseIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

export const brandType = defineType({
  name: 'brand',
  title: 'Brand',
  type: 'document',
  icon: CaseIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Brand Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'logo',
      title: 'Brand Logo',
      type: 'image',
      options: {
        hotspot: true,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'isAuthorisedReseller',
      title: 'Authorised Reseller',
      type: 'boolean',
      initialValue: false,
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
      title: 'name',
      media: 'logo',
      isReseller: 'isAuthorisedReseller',
    },
    prepare(select) {
      const { title, media, isReseller } = select;
      return {
        title,
        media,
        subtitle: isReseller ? 'Authorised Reseller 👑' : '',
      };
    },
  },
});
