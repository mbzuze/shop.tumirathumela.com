import { defineField, defineType } from "sanity";

export const customerAddressType = defineType({
  name: "customerAddress",
  title: "Customer Address",
  type: "document",
  fields: [
    defineField({
      name: "clerkUserId",
      title: "Clerk User ID",
      type: "string",
      description: "The Clerk auth user ID this address belongs to.",
      hidden: true,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "fullName",
      title: "Full Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "phone",
      title: "Phone Number",
      type: "string",
      description: "Include country code, e.g. +27821234567",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "streetAddress",
      title: "Street Address",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "buildingDetails",
      title: "Building Details",
      type: "string",
      description: "Unit number, complex name, floor, etc. (optional)",
    }),
    defineField({
      name: "suburb",
      title: "Suburb",
      type: "string",
    }),
    defineField({
      name: "city",
      title: "City",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "province",
      title: "Province / State",
      type: "string",
    }),
    defineField({
      name: "postalCode",
      title: "Postal Code",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "country",
      title: "Country",
      type: "string",
      options: {
        list: [
          { title: "South Africa", value: "ZA" },
          { title: "Zimbabwe", value: "ZW" },
        ],
        layout: "radio",
      },
      initialValue: "ZA",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "isDefault",
      title: "Default Address",
      type: "boolean",
      initialValue: false,
      description: "Only one address per user should have this set to true.",
    }),
    defineField({
      name: "addressType",
      title: "Address Type",
      type: "string",
      options: {
        list: [
          { title: "Home / Residential", value: "Home/Residential" },
          { title: "Office / Business", value: "Office/Business" },
        ],
        layout: "radio",
      },
      initialValue: "Home/Residential",
    }),
    defineField({
      name: "deliveryInstructions",
      title: "Delivery Instructions",
      type: "text",
      rows: 3,
      description:
        "Optional: building description, nearby landmark, gate code, etc.",
    }),
  ],
  preview: {
    select: {
      title: "fullName",
      subtitle: "city",
      isDefault: "isDefault",
    },
    prepare({ title, subtitle, isDefault }) {
      return {
        title: `${title}${isDefault ? " ★ Default" : ""}`,
        subtitle,
      };
    },
  },
});
