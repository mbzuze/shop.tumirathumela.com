/**
 * One-off seed: populates a curated, realistic demo catalog (~1000 products
 * across ~15 general e-commerce categories) so the storefront isn't launching
 * empty. Product names are generated from real-world product concepts x
 * realistic variant attributes (color/size/capacity/etc.), not placeholder
 * text — the same combinatorial pattern real e-commerce catalogs use.
 *
 * Usage: npx tsx scripts/seed-demo-catalog.ts
 */
import { PrismaClient } from '@prisma/client'
import { createId } from '@paralleldrive/cuid2'

const prisma = new PrismaClient()
const SEED_BY = 'seed-script'

// ── Helpers ──────────────────────────────────────────────────────────────────

function richText(text: string) {
  return {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
  }
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// Deterministic pseudo-random price within [min, max], landing on a
// psychological price ending in 9 (e.g. 299, 349) like a real storefront.
function priceFor(min: number, max: number, seed: number): number {
  const span = max - min
  const raw = min + ((seed * 37 + 13) % span)
  return Math.max(min, Math.round(raw / 10) * 10 - 1)
}

interface CategorySpec {
  slug: string
  name: string
  description: string
  baseItems: string[]
  variants: string[]
  priceRange: [number, number]
}

// ── Category + product catalog definitions ──────────────────────────────────

const CATEGORIES: CategorySpec[] = [
  {
    slug: 'electronics',
    name: 'Electronics',
    description: 'Phones, audio, computing accessories, and smart devices.',
    baseItems: [
      'Wireless Bluetooth Headphones', 'Noise-Cancelling Earbuds', 'Portable Bluetooth Speaker',
      '4K Smart TV 55-inch', 'Streaming Media Player', 'Wireless Charging Pad', 'Power Bank 20000mAh',
      'USB-C Fast Charger', 'Laptop Backpack', 'Wireless Mouse', 'Mechanical Keyboard',
      'Webcam 1080p', 'External SSD Drive 1TB', 'HDMI Cable 2m', 'Smart Plug', 'Video Doorbell',
      'Fitness Tracker Watch', 'Action Camera', 'Tablet Stand', 'Car Phone Mount',
    ],
    variants: ['Black', 'White', 'Silver', 'Blue', 'Space Grey'],
    priceRange: [149, 4999],
  },
  {
    slug: 'home-kitchen',
    name: 'Home & Kitchen',
    description: 'Appliances, cookware, and everyday home essentials.',
    baseItems: [
      'Stand Mixer 5.5L', 'Air Fryer 6L', 'Non-Stick Frying Pan 28cm', 'Stainless Steel Cookware Set',
      'Electric Kettle 1.7L', 'Coffee Maker Drip', 'Blender 1.5L', 'Toaster 4-Slice',
      'Cutting Board Set', 'Knife Set 6-Piece', 'Storage Container Set', 'Dish Rack',
      'Microwave 20L', 'Slow Cooker 5L', 'Rice Cooker 1.8L', 'Vacuum Flask 1L', 'Bakeware Set',
      'Kitchen Scale Digital', 'Dinner Plate Set 6-Piece', 'Cutlery Set 24-Piece',
    ],
    variants: ['Standard', 'Deluxe', 'Compact', 'Family Size'],
    priceRange: [199, 3499],
  },
  {
    slug: 'fashion-apparel',
    name: 'Fashion & Apparel',
    description: "Everyday clothing for women, men, and kids.",
    baseItems: [
      'Cotton T-Shirt', 'Denim Jeans', 'Hooded Sweatshirt', 'Running Shoes', 'Leather Belt',
      'Summer Dress', 'Formal Shirt', 'Chino Pants', 'Winter Jacket', 'Sports Leggings',
      'Ankara Print Dress', 'Canvas Sneakers', 'Wool Sweater', 'Polo Shirt', 'Cargo Shorts',
      'Rain Jacket', 'Sun Hat', 'Ankle Socks 3-Pack', 'Sandals', 'Beanie',
    ],
    variants: ['Small', 'Medium', 'Large', 'X-Large', 'Black'],
    priceRange: [99, 1499],
  },
  {
    slug: 'beauty-personal-care',
    name: 'Beauty & Personal Care',
    description: 'Skincare, haircare, and grooming essentials.',
    baseItems: [
      'Vitamin C Serum', 'Moisturising Face Cream', 'Sunscreen SPF50', 'Shampoo & Conditioner Set',
      'Hair Dryer 2200W', 'Electric Shaver', 'Facial Cleanser', 'Body Lotion 400ml', 'Lip Balm Set',
      'Makeup Brush Set', 'Nail Care Kit', 'Perfume 50ml', 'Deodorant Roll-On', 'Hair Straightener',
      'Beard Trimmer', 'Exfoliating Scrub', 'Eye Cream', 'Toothbrush Electric', 'Bath Bomb Set',
      'Hand Cream 75ml',
    ],
    variants: ['Sensitive Skin', 'Everyday', 'Travel Size', 'Family Pack'],
    priceRange: [69, 899],
  },
  {
    slug: 'sports-outdoors',
    name: 'Sports & Outdoors',
    description: 'Fitness gear, camping equipment, and outdoor essentials.',
    baseItems: [
      'Yoga Mat 6mm', 'Adjustable Dumbbell Set', 'Resistance Bands Set', 'Camping Tent 2-Person',
      'Sleeping Bag', 'Hiking Backpack 40L', 'Water Bottle 750ml', 'Cycling Helmet', 'Football',
      'Basketball', 'Skipping Rope', 'Foam Roller', 'Camping Chair Folding', 'Head Torch LED',
      'Fishing Rod Combo', 'Trail Running Shoes', 'Gym Duffel Bag', 'Cooler Box 25L',
      'Swim Goggles', 'Jump Rope Speed',
    ],
    variants: ['Black', 'Red', 'Blue', 'Green'],
    priceRange: [129, 2999],
  },
  {
    slug: 'toys-games',
    name: 'Toys & Games',
    description: 'Toys, puzzles, and games for all ages.',
    baseItems: [
      'Building Blocks Set 500pc', 'Remote Control Car', 'Board Game Family Edition', 'Jigsaw Puzzle 1000pc',
      'Plush Teddy Bear', 'Action Figure Set', 'Doll House', 'Card Game Classic', 'Educational Tablet for Kids',
      'Art & Craft Kit', 'Play Kitchen Set', 'Toy Train Set', 'Water Gun', 'Kite',
      'Chess Set Wooden', 'Building Bricks Vehicle Set', 'Musical Toy Piano', 'Science Experiment Kit',
      'Toy Drone', 'Outdoor Trampoline',
    ],
    variants: ['Standard Edition', 'Deluxe Edition', 'Junior', 'Family Size'],
    priceRange: [99, 2499],
  },
  {
    slug: 'books-media',
    name: 'Books & Media',
    description: 'Fiction, non-fiction, and children\'s books.',
    baseItems: [
      'Mystery Thriller Novel', 'Contemporary Romance Novel', 'Epic Fantasy Novel', 'Science Fiction Saga',
      'Historical Fiction Novel', 'Self-Help Guide', 'Business Strategy Book', 'Children\'s Picture Book',
      'Young Adult Adventure Novel', 'True Crime Story', 'Cookbook Collection', 'Poetry Anthology',
      'Biography', 'Travel Guide', 'Personal Finance Book', 'Graphic Novel', 'Classic Literature Edition',
      'Parenting Guide',
    ],
    variants: ['Gripping', 'Bestselling', 'Award-Winning', 'Illustrated', "Reader's Choice"],
    priceRange: [89, 449],
  },
  {
    slug: 'grocery-gourmet',
    name: 'Grocery & Gourmet',
    description: 'Pantry staples, snacks, and gourmet food.',
    baseItems: [
      'Extra Virgin Olive Oil 750ml', 'Organic Honey 500g', 'Roasted Coffee Beans 1kg', 'Herbal Tea Selection Box',
      'Pasta Variety Pack', 'Basmati Rice 5kg', 'Mixed Nuts 500g', 'Dark Chocolate Bar',
      'Peanut Butter 400g', 'Breakfast Cereal', 'Spice Rack Set', 'Dried Fruit Mix 500g',
      'Sparkling Water 6-Pack', 'Sourdough Bread Mix', 'Balsamic Vinegar 500ml', 'Protein Snack Bars 12-Pack',
      'Granola 750g', 'Olive Tapenade', 'Chutney Jar', 'Biltong 250g',
    ],
    variants: ['Original', 'Family Pack', 'Premium', 'Organic'],
    priceRange: [39, 599],
  },
  {
    slug: 'health-wellness',
    name: 'Health & Wellness',
    description: 'Vitamins, supplements, and wellness devices.',
    baseItems: [
      'Multivitamin Tablets 90-Count', 'Omega-3 Fish Oil Capsules', 'Vitamin D3 Drops', 'Protein Powder 1kg',
      'Digital Blood Pressure Monitor', 'Digital Thermometer', 'First Aid Kit', 'Essential Oil Diffuser',
      'Magnesium Supplement', 'Probiotic Capsules', 'Herbal Sleep Aid', 'Compression Socks',
      'Massage Gun', 'Posture Corrector', 'Hot & Cold Therapy Pack', 'Digital Kitchen Scale for Diet',
      'Reusable Face Masks 3-Pack', 'Hand Sanitizer 500ml',
    ],
    variants: ['30-Day Supply', '60-Day Supply', 'Family Pack', 'Travel Size'],
    priceRange: [79, 1299],
  },
  {
    slug: 'baby-kids',
    name: 'Baby & Kids',
    description: 'Baby gear, feeding, and nursery essentials.',
    baseItems: [
      'Baby Stroller 3-Wheel', 'Convertible Car Seat', 'Baby Monitor with Camera', 'Nursing Pillow',
      'Baby Bottle Set', 'Diaper Bag Backpack', 'Baby Bath Tub', 'Convertible Crib',
      'Baby Carrier Ergonomic', 'High Chair Adjustable', 'Baby Swaddle Blanket Set', 'Teething Toy Set',
      'Baby Monitor Audio', 'Kids Backpack', 'Toddler Booster Seat', 'Baby Play Mat',
      'Kids Bicycle Helmet', 'Baby Grooming Kit',
    ],
    variants: ['Newborn', '0-12 Months', 'Toddler', 'Unisex', 'Pastel'],
    priceRange: [149, 3999],
  },
  {
    slug: 'automotive',
    name: 'Automotive',
    description: 'Car accessories, care products, and tools.',
    baseItems: [
      'Car Phone Holder', 'Dash Cam 1080p', 'Car Vacuum Cleaner', 'Tyre Pressure Gauge',
      'Car Seat Covers Set', 'Jump Starter Portable', 'Car Wax Kit', 'Microfiber Cleaning Cloths 12-Pack',
      'Car Air Freshener', 'Steering Wheel Cover', 'LED Headlight Bulbs', 'Car Emergency Kit',
      'Windshield Sun Shade', 'Car Floor Mats Set', 'Tow Rope Heavy Duty', 'Portable Tyre Inflator',
      'Car Battery Charger', 'Bluetooth FM Transmitter',
    ],
    variants: ['Universal Fit', 'Compact', 'Heavy Duty', 'Premium'],
    priceRange: [99, 2999],
  },
  {
    slug: 'office-stationery',
    name: 'Office & Stationery',
    description: 'Office supplies, stationery, and desk accessories.',
    baseItems: [
      'Ergonomic Office Chair', 'Standing Desk Converter', 'Notebook A5 Ruled', 'Fountain Pen Set',
      'Desk Organizer', 'Whiteboard 90x60cm', 'Sticky Notes Pack', 'Printer Paper A4 500-Sheet',
      'Stapler Heavy Duty', 'Highlighter Set', 'Desk Lamp LED', 'Filing Cabinet 2-Drawer',
      'Calculator Scientific', 'Laptop Stand Adjustable', 'Whiteboard Markers Set', 'Binder Clips Assorted',
      'Document Shredder', 'Wireless Presenter Remote',
    ],
    variants: ['Standard', 'Executive', 'Compact', 'Ergonomic'],
    priceRange: [79, 2999],
  },
  {
    slug: 'pet-supplies',
    name: 'Pet Supplies',
    description: 'Food, toys, and accessories for dogs and cats.',
    baseItems: [
      'Dry Dog Food 10kg', 'Dry Cat Food 5kg', 'Pet Bed Plush', 'Dog Leash & Collar Set',
      'Cat Scratching Post', 'Pet Carrier Travel', 'Automatic Pet Feeder', 'Dog Chew Toy Durable',
      'Cat Litter Box', 'Pet Grooming Brush', 'Dog Training Treats', 'Cat Toy Wand',
      'Pet Water Fountain', 'Dog Raincoat', 'Aquarium Starter Kit 20L', 'Bird Cage Medium',
      'Pet Nail Clipper', 'Dog Bandana Set',
    ],
    variants: ['Small Breed', 'Medium Breed', 'Large Breed', 'Kitten', 'Adult'],
    priceRange: [59, 1999],
  },
  {
    slug: 'garden-tools',
    name: 'Garden & Tools',
    description: 'Gardening equipment, tools, and outdoor maintenance.',
    baseItems: [
      'Cordless Drill 18V', 'Garden Hose 30m', 'Pruning Shears', 'Lawn Mower Electric',
      'Wheelbarrow Steel', 'Garden Tool Set 5-Piece', 'Watering Can 10L', 'Leaf Blower Cordless',
      'Hedge Trimmer', 'Planter Pots Set', 'Garden Gloves', 'Sprinkler Oscillating',
      'Tool Storage Box', 'Hammer Claw 16oz', 'Screwdriver Set 20-Piece', 'Extension Ladder 3m',
      'Wheelbarrow Cart', 'Outdoor Solar Lights Set',
    ],
    variants: ['Standard', 'Heavy Duty', 'Compact', 'Professional'],
    priceRange: [99, 3999],
  },
  {
    slug: 'jewelry-watches',
    name: 'Jewelry & Watches',
    description: 'Fashion jewelry, watches, and accessories.',
    baseItems: [
      'Stainless Steel Watch', 'Sterling Silver Necklace', 'Beaded Bracelet Set', 'Stud Earrings Pack',
      'Leather Strap Watch', 'Gold-Plated Ring', 'Charm Bracelet', 'Pendant Necklace',
      'Cufflinks Set', 'Hoop Earrings', 'Chronograph Watch', 'Anklet Chain',
      'Sunglasses Polarized', 'Wallet Leather Bifold', 'Tie & Pocket Square Set', 'Scarf Silk',
      'Handbag Crossbody', 'Belt Buckle Set',
    ],
    variants: ['Gold Tone', 'Silver Tone', 'Rose Gold', 'Black', 'Classic'],
    priceRange: [129, 2999],
  },
]

// A modest pool of brand-neutral brand names to distribute across products.
const BRANDS = [
  'Northline', 'Everton', 'Cascade Home', 'Vertex', 'Solace', 'Brightway', 'Kindred Goods',
  'Meridian', 'Fieldstone', 'Aura', 'Rockridge', 'Palette', 'Everbright', 'Lumen', 'Terra & Co',
  'Vantage', 'Crestline', 'Harbor & Oak', 'Novara', 'Amble', 'Cobalt Works', 'Willow Lane',
  'Peak Supply Co', 'Glowick', 'Basecamp', 'Marlow', 'Stonefield', 'Driftwood', 'Anchorpoint', 'Fernbrook',
]

// ~1000 products / 15 categories ≈ 67 each — cap so the catalog lands close
// to the requested size instead of the full base-x-variant cross product.
const TARGET_PER_CATEGORY = 67

function buildProducts(cat: CategorySpec): { name: string; price: number; brandIdx: number }[] {
  const out: { name: string; price: number; brandIdx: number }[] = []
  let i = 0
  outer: for (const base of cat.baseItems) {
    for (const variant of cat.variants) {
      if (out.length >= TARGET_PER_CATEGORY) break outer
      out.push({
        name: `${base} - ${variant}`,
        price: priceFor(cat.priceRange[0], cat.priceRange[1], i + base.length + variant.length),
        brandIdx: i % BRANDS.length,
      })
      i++
    }
  }
  return out
}

// ── Seed ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding demo catalog...')

  const brandBySlug = new Map<string, string>()
  for (const [idx, name] of BRANDS.entries()) {
    const slug = slugify(name)
    const brand = await prisma.brand.upsert({
      where: { slug },
      update: {},
      create: { id: createId(), name, slug, isActive: true, sortOrder: idx },
    })
    brandBySlug.set(slug, brand.id)
  }
  console.log(`  ${BRANDS.length} brands ready`)

  let totalProducts = 0
  for (const [catIdx, cat] of CATEGORIES.entries()) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        id: createId(),
        slug: cat.slug,
        name: cat.name,
        description: cat.description,
        isActive: true,
        sortOrder: catIdx,
      },
    })

    const products = buildProducts(cat)
    for (const [i, p] of products.entries()) {
      const slug = `${cat.slug}-${slugify(p.name)}`
      const brandId = brandBySlug.get(slugify(BRANDS[p.brandIdx]))
      const isFeatured = i % 23 === 0
      const isBestSeller = i % 17 === 0
      const picsumSeed = `${cat.slug}-${i}`

      const media = await prisma.media.create({
        data: {
          id: createId(),
          filename: `${picsumSeed}.jpg`,
          originalName: `${picsumSeed}.jpg`,
          mimeType: 'image/jpeg',
          size: 0,
          diskPath: `seed/${picsumSeed}`,
          publicUrl: `https://picsum.photos/seed/${encodeURIComponent(picsumSeed)}/800/800`,
          type: 'IMAGE',
          uploadedBy: SEED_BY,
        },
      })

      await prisma.product.upsert({
        where: { slug },
        update: {},
        create: {
          id: createId(),
          slug,
          status: 'PUBLISHED',
          name: p.name,
          description: richText(
            `${p.name} from ${BRANDS[p.brandIdx]}. A dependable choice in our ${cat.name.toLowerCase()} range, built for everyday use and backed by our quality guarantee.`
          ),
          shortDescription: `${p.name} — a ${cat.name.toLowerCase()} favourite.`,
          price: p.price,
          stock: 10 + (i % 40),
          isActive: true,
          isFeatured,
          isBestSeller,
          rating: 3.5 + ((i % 15) / 10),
          reviewCount: (i * 3) % 240,
          categoryId: category.id,
          brandId,
          publishedAt: new Date(),
          createdBy: SEED_BY,
          updatedBy: SEED_BY,
          images: {
            create: [{ id: createId(), mediaId: media.id, position: 0 }],
          },
        },
      })
      totalProducts++
    }
    console.log(`  ${cat.name}: ${products.length} products`)
  }

  console.log(`Done. ${CATEGORIES.length} categories, ${totalProducts} products.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
