import { BasketIcon } from "@sanity/icons"
import { defineArrayMember, defineField, defineType } from "sanity"

export const orderType = defineType({
    name: 'order',
    title: 'Order',
    type: 'document',
    fields: [
        defineField({
            name: 'orderNumber',
            title: 'Order Number',
            type: 'string',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'stripeCheckoutSessionId',
            title: 'Stripe Checkout Session ID',
            type: 'string',
        }),
        defineField({
            name: 'stripeCustomerId',
            title: 'Stripe Customer ID',
            type: 'string',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'stripePaymentIntentId',
            title: 'Stripe Payment Intent ID',
            type: 'string',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'clerkUserId',
            title: 'Clerk User ID',
            type: 'string',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'customerName',
            title: 'Customer Name',
            type: 'string',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'customerEmail',
            title: 'Customer Email',
            type: 'string',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'customerPhone',
            title: 'Customer Phone',
            type: 'string',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'customerAddress',
            title: 'Customer Address',
            type: 'string',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'customerCity',
            title: 'Customer City',
            type: 'string',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'customerState',
            title: 'Customer State',
            type: 'string',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'orderDate',
            title: 'Order Date',
            type: 'date',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'orderItems',
            title: 'Order Items',
            type: 'array',
            of: [
                defineArrayMember({
                    type: 'object',
                    fields: [
                        defineField({ name: 'product', title: 'Product Bought', type: 'reference', to: [{ type: 'product' }] }),
                        defineField({ name: 'quantity', title: 'Quantity Purchased', type: 'number' }),
                    ],
                    preview: {
                        select: {
                            product: 'product.name',
                            quantity: 'quantity',
                            image: 'product.images[0]',
                            price: 'product.price',
                            currency: 'product.currency',
                        },
                        prepare(select) {
                            const { product, quantity, image, price, currency } = select
                            return {
                                title: `${quantity} x ${product}`,
                                subtitle: `${price} * ${quantity}`,
                                media: image,
                            }
                        }
                    }
                }),
            ],
        }),
        defineField({
            name: 'total',
            title: 'Total Amount',
            type: 'number',
        }),
        defineField({
            name: 'status',
            title: 'Order Status',
            type: 'string',
            options: {
                list: [
                    { title: 'Pending', value: 'pending' },
                    { title: 'Processing', value: 'processing' },
                    { title: 'Completed', value: 'completed' },
                    { title: 'Cancelled', value: 'cancelled' },
                ],
            },
        }),
    ],
    preview: {
        select: {
            name: 'customerName',
            amount: 'total',
            currency: 'currency',
            orderId: 'orderNumber',
            email: 'customerEmail',
        },
        prepare(select) {
            const orderIdSnippet = `${select.orderId.slice(0, 5)}...${select.orderId.slice(-5)}`
            const { name, amount, currency, email } = select
            return {
                title: `Order by ${name || 'Unknown Customer'} (${orderIdSnippet})`,
                subtitle: `${currency} ${amount}, ${email}`,
                media: BasketIcon
            }
        },
    },
})

