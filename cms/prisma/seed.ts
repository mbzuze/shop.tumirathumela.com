import { PrismaClient } from '@prisma/client'
import { createId } from '@paralleldrive/cuid2'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding TumiraCMS...')

  // Categories
  const women = await prisma.category.upsert({
    where: { slug: 'women' },
    update: {},
    create: { id: createId(), name: "Women's", slug: 'women', description: "Women's fashion", isActive: true, sortOrder: 0 },
  })
  const men = await prisma.category.upsert({
    where: { slug: 'men' },
    update: {},
    create: { id: createId(), name: "Men's", slug: 'men', description: "Men's fashion", isActive: true, sortOrder: 1 },
  })
  const accessories = await prisma.category.upsert({
    where: { slug: 'accessories' },
    update: {},
    create: { id: createId(), name: 'Accessories', slug: 'accessories', description: 'Fashion accessories', isActive: true, sortOrder: 2 },
  })
  await prisma.category.upsert({
    where: { slug: 'women-dresses' },
    update: {},
    create: { id: createId(), name: 'Dresses', slug: 'women-dresses', parentId: women.id, isActive: true, sortOrder: 0 },
  })
  await prisma.category.upsert({
    where: { slug: 'women-tops' },
    update: {},
    create: { id: createId(), name: 'Tops', slug: 'women-tops', parentId: women.id, isActive: true, sortOrder: 1 },
  })

  // Brands
  const brand1 = await prisma.brand.upsert({
    where: { slug: 'tumira-originals' },
    update: {},
    create: { id: createId(), name: 'Tumira Originals', slug: 'tumira-originals', isActive: true },
  })
  const brand2 = await prisma.brand.upsert({
    where: { slug: 'afro-luxe' },
    update: {},
    create: { id: createId(), name: 'Afro Luxe', slug: 'afro-luxe', isActive: true },
  })

  // Tags
  const tagNew = await prisma.tag.upsert({ where: { slug: 'new-arrivals' }, update: {}, create: { id: createId(), name: 'New Arrivals', slug: 'new-arrivals' } })
  const tagBestSeller = await prisma.tag.upsert({ where: { slug: 'best-seller' }, update: {}, create: { id: createId(), name: 'Best Seller', slug: 'best-seller' } })

  // Products
  const richTextDescription = (text: string) => ({
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
  })

  const product1 = await prisma.product.upsert({
    where: { slug: 'ankara-wrap-dress' },
    update: {},
    create: {
      id: createId(),
      name: 'Ankara Wrap Dress',
      slug: 'ankara-wrap-dress',
      sku: 'AWD-001',
      description: richTextDescription('Vibrant African print wrap dress, handcrafted from premium cotton for a bold, elevated look.'),
      shortDescription: 'Vibrant African print wrap dress — perfect for any occasion.',
      price: 899,
      compareAtPrice: 1200,
      status: 'PUBLISHED',
      isFeatured: true,
      isBestSeller: true,
      categoryId: women.id,
      brandId: brand1.id,
      stock: 25,
      rating: 4.5,
      reviewCount: 12,
      seoTitle: 'Ankara Wrap Dress | Tumira',
      seoDescription: 'Shop the Ankara Wrap Dress — handcrafted African print fashion.',
      createdBy: 'seed',
      updatedBy: 'seed',
      publishedAt: new Date(),
      tags: { create: [{ tagId: tagNew.id }, { tagId: tagBestSeller.id }] },
    },
  })

  const product2 = await prisma.product.upsert({
    where: { slug: 'kente-stripe-blazer' },
    update: {},
    create: {
      id: createId(),
      name: 'Kente Stripe Blazer',
      slug: 'kente-stripe-blazer',
      sku: 'KSB-001',
      description: richTextDescription('Tailored blazer with authentic Kente stripe fabric — smart-casual with African heritage.'),
      shortDescription: 'Tailored blazer with authentic Kente stripe fabric.',
      price: 1299,
      status: 'PUBLISHED',
      isFeatured: true,
      categoryId: men.id,
      brandId: brand2.id,
      stock: 10,
      createdBy: 'seed',
      updatedBy: 'seed',
      publishedAt: new Date(),
      tags: { create: [{ tagId: tagNew.id }] },
    },
  })

  const product3 = await prisma.product.upsert({
    where: { slug: 'beaded-statement-necklace' },
    update: {},
    create: {
      id: createId(),
      name: 'Beaded Statement Necklace',
      slug: 'beaded-statement-necklace',
      sku: 'BSN-001',
      description: richTextDescription('Handcrafted beaded necklace — bold African aesthetic, statement-making finish.'),
      shortDescription: 'Handcrafted beaded necklace — bold African aesthetic.',
      price: 299,
      status: 'PUBLISHED',
      categoryId: accessories.id,
      brandId: brand1.id,
      stock: 50,
      createdBy: 'seed',
      updatedBy: 'seed',
      publishedAt: new Date(),
    },
  })

  // Product variants for dress
  const existingVariant = await prisma.productVariant.findFirst({ where: { productId: product1.id, sku: 'AWD-001-S' } })
  if (!existingVariant) {
    await prisma.productVariant.createMany({
      data: [
        { id: createId(), productId: product1.id, name: 'Size', options: [{ name: 'Size', value: 'S' }], sku: 'AWD-001-S', price: 899, stock: 8 },
        { id: createId(), productId: product1.id, name: 'Size', options: [{ name: 'Size', value: 'M' }], sku: 'AWD-001-M', price: 899, stock: 10 },
        { id: createId(), productId: product1.id, name: 'Size', options: [{ name: 'Size', value: 'L' }], sku: 'AWD-001-L', price: 899, stock: 5 },
        { id: createId(), productId: product1.id, name: 'Size', options: [{ name: 'Size', value: 'XL' }], sku: 'AWD-001-XL', price: 899, stock: 2 },
      ],
    })
  }

  // Collection
  const collection = await prisma.collection.upsert({
    where: { slug: 'new-arrivals' },
    update: {},
    create: {
      id: createId(),
      name: 'New Arrivals',
      slug: 'new-arrivals',
      description: 'Our latest additions to the store.',
      status: 'PUBLISHED',
      seoTitle: 'New Arrivals | Tumira',
      seoDescription: 'Shop our newest fashion pieces — just landed.',
    },
  })

  const existingCollectionProduct = await prisma.collectionProduct.findFirst({ where: { collectionId: collection.id } })
  if (!existingCollectionProduct) {
    await prisma.collectionProduct.createMany({
      data: [
        { collectionId: collection.id, productId: product1.id, position: 0 },
        { collectionId: collection.id, productId: product2.id, position: 1 },
        { collectionId: collection.id, productId: product3.id, position: 2 },
      ],
    })
  }

  // Hero banner
  await prisma.heroBanner.upsert({
    where: { id: 'seed-banner-1' },
    update: {},
    create: {
      id: 'seed-banner-1',
      title: 'New Season, New You',
      subtitle: 'Discover our latest African-inspired collection',
      ctaText: 'Shop Now',
      ctaUrl: '/collections/new-arrivals',
      overlayOpacity: 50,
      textColor: '#ffffff',
      isActive: true,
      sortOrder: 0,
    },
  })

  // Homepage sections
  await prisma.homepageSection.upsert({
    where: { id: 'seed-section-1' },
    update: {},
    create: {
      id: 'seed-section-1',
      title: 'Featured Products',
      variant: 'FEATURED_PRODUCTS',
      locale: 'BOTH',
      isActive: true,
      sortOrder: 0,
    },
  })

  // Site settings
  const defaultSettings = [
    { key: 'site.name', value: 'Tumira Thumela' },
    { key: 'site.tagline', value: 'African Fashion, Elevated' },
    { key: 'site.email', value: 'hello@tumirathumela.com' },
    { key: 'shipping.freeThreshold', value: '1000' },
    { key: 'shipping.standardRate', value: '80' },
    { key: 'announcement.enabled', value: 'true' },
    { key: 'announcement.message', value: 'Free shipping on orders over R1000!' },
  ]

  for (const setting of defaultSettings) {
    await prisma.siteSettings.upsert({
      where: { key: setting.key },
      update: {},
      create: { id: createId(), key: setting.key, value: setting.value, updatedBy: 'seed' },
    })
  }

  // Sample approved review
  const existingReview = await prisma.review.findFirst({ where: { productId: product1.id } })
  if (!existingReview) {
    await prisma.review.create({
      data: {
        id: createId(),
        productId: product1.id,
        clerkUserId: 'seed_user_1',
        authorName: 'Amara N.',
        rating: 5,
        title: 'Absolutely stunning!',
        body: 'The fabric quality is exceptional and the fit is perfect. I got so many compliments wearing this to a wedding.',
        isApproved: true,
        isVerifiedPurchase: true,
        helpfulVotes: 8,
      },
    })
    await prisma.review.create({
      data: {
        id: createId(),
        productId: product1.id,
        clerkUserId: 'seed_user_2',
        authorName: 'Thembi M.',
        rating: 4,
        body: 'Beautiful dress, true to size. Delivery was quick too.',
        isApproved: true,
        isVerifiedPurchase: true,
        helpfulVotes: 3,
      },
    })
  }

  console.log('✓ Seed complete')
  console.log(`  Categories: Women's, Men's, Accessories + 2 sub-categories`)
  console.log(`  Brands: Tumira Originals, Afro Luxe`)
  console.log(`  Products: Ankara Wrap Dress, Kente Stripe Blazer, Beaded Statement Necklace`)
  console.log(`  Collection: New Arrivals`)
  console.log(`  Hero banner + Homepage section + Site settings seeded`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
