import { defineField, defineType } from "sanity";

export const productVariantType = defineType({
  name: "productVariant",
  title: "Product Variant",
  type: "object",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({
      name: "sku",
      title: "SKU",
      type: "string",
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({
      name: "price",
      title: "Price (ZAR)",
      type: "number",
      validation: (Rule: any) => Rule.required().positive(),
    }),
    defineField({
      name: "stockCount",
      title: "Stock Count",
      type: "number",
      validation: (Rule: any) => Rule.required().min(0),
    }),
    defineField({
      name: "images",
      title: "Variant Images",
      type: "array",
      of: [{ type: "image", options: { hotspot: true } }],
    }),
  ],
});
