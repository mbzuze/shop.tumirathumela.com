import { createClient } from "next-sanity";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";

// Manually load .env.local if running outside Next.js environment
try {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, "utf-8");
    envConfig.split("\n").forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || "";
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value;
      }
    });
  }
} catch (err) {
  console.warn("Failed to load .env.local manually:", err);
}

// Check environment variables
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_API_TOKEN;

if (!projectId || !dataset || !token) {
  console.error("Missing configuration. Please set NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET and SANITY_API_TOKEN.");
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2023-05-03",
  useCdn: false,
  token,
});

async function uploadImage(url: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);
    const buffer = await res.arrayBuffer();
    const asset = await client.assets.upload('image', Buffer.from(buffer), {
      filename: 'seed-image.jpg'
    });
    return asset._id;
  } catch (e) {
    console.error(`Image upload failed for ${url}:`, e);
    return null;
  }
}

async function seed() {
  console.log("Starting seed process with updated schemas...");

  // Upload realistic placeholder images for our key categories to make it look premium
  console.log("Uploading category and product images...");
  const tvImageId = await uploadImage("https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=500&q=80"); // TV
  const vitaminsImageId = await uploadImage("https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&q=80"); // Vitamins
  const booksImageId = await uploadImage("https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&q=80"); // Books
  const electronicsImageId = await uploadImage("https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80"); // Headphones

  const fallbackImageId = tvImageId || vitaminsImageId || booksImageId || electronicsImageId;

  // 1. Create Brands
  console.log("Creating brands...");
  const BRANDS = [
    { name: "Sony", slug: "sony", reseller: true, sort: 1 },
    { name: "Samsung", slug: "samsung", reseller: true, sort: 2 },
    { name: "Solal", slug: "solal", reseller: false, sort: 3 },
    { name: "Biogen", slug: "biogen", reseller: false, sort: 4 },
    { name: "Penguin Books", slug: "penguin-books", reseller: false, sort: 5 },
    { name: "Apple", slug: "apple", reseller: true, sort: 6 }
  ];

  const brandIdMap: Record<string, string> = {};

  for (const b of BRANDS) {
    const brandDoc = {
      _type: "brand",
      name: b.name,
      slug: { _type: "slug", current: b.slug },
      isAuthorisedReseller: b.reseller,
      sortOrder: b.sort,
      logo: fallbackImageId ? { _type: "image", asset: { _ref: fallbackImageId } } : undefined
    };
    const createdBrand = await client.create(brandDoc);
    console.log(`Created brand: ${createdBrand.name}`);
    brandIdMap[b.name] = createdBrand._id;
  }

  // 2. Create Categories
  console.log("Creating categories...");
  const CATEGORIES = [
    { name: "TV & Home Entertainment", slug: "tv-home-entertainment", image: tvImageId, sort: 1 },
    { name: "Vitamins & Supplements", slug: "vitamins-supplements", image: vitaminsImageId, sort: 2 },
    { name: "Books", slug: "books", image: booksImageId, sort: 3 },
    { name: "Electronics & Gadgets", slug: "electronics-gadgets", image: electronicsImageId, sort: 4 }
  ];

  const categoryIdMap: Record<string, string> = {};

  for (const cat of CATEGORIES) {
    const catDoc = {
      _type: 'category',
      name: cat.name,
      slug: { _type: 'slug', current: cat.slug },
      description: `Premium collection of ${cat.name}`,
      sortOrder: cat.sort,
      image: cat.image ? { _type: 'image', asset: { _ref: cat.image } } : undefined
    };

    const createdCat = await client.create(catDoc);
    console.log(`Created category: ${createdCat.name}`);
    categoryIdMap[cat.name] = createdCat._id;
  }

  // 3. Create Products with realistic details
  console.log("Creating products...");
  
  const PRODUCTS = [
    // TV Category
    {
      name: "Sony 65-inch BRAVIA XR OLED 4K Smart TV",
      slug: "sony-65-bravia-xr-oled",
      price: 24999,
      compareAtPrice: 28999,
      sku: "TV-SONY-65OLED",
      category: "TV & Home Entertainment",
      brand: "Sony",
      image: tvImageId,
      badge: "limited-time",
      percent: 15,
      desc: "Experience pure black and gorgeous contrast with Sony's premium OLED TV. Powered by the Cognitive Processor XR for stunning cinematic realism."
    },
    {
      name: "Samsung 55-inch QLED 4K HDR Smart TV",
      slug: "samsung-55-qled-4k",
      price: 12999,
      compareAtPrice: 14999,
      sku: "TV-SAMS-55QLED",
      category: "TV & Home Entertainment",
      brand: "Samsung",
      image: tvImageId,
      badge: "percent-off",
      percent: 13,
      desc: "Bright, rich colors and extreme clarity are yours with Samsung QLED technology. Stream your favorite content instantly with Tizen OS."
    },
    
    // Vitamins Category
    {
      name: "Solal Vitamin C 1000mg Buffered Tablets",
      slug: "solal-vitamin-c-1000mg",
      price: 189,
      compareAtPrice: 219,
      sku: "VIT-SOL-C1000",
      category: "Vitamins & Supplements",
      brand: "Solal",
      image: vitaminsImageId,
      badge: "new",
      percent: 0,
      desc: "Highly bioavailable and buffered to prevent stomach irritation, Solal's Vitamin C supports cellular health and robust immune function."
    },
    {
      name: "Biogen Multivitamin Plus Energy Booster",
      slug: "biogen-multivitamin-plus",
      price: 259,
      compareAtPrice: 299,
      sku: "VIT-BIO-MULTI",
      category: "Vitamins & Supplements",
      brand: "Biogen",
      image: vitaminsImageId,
      badge: "percent-off",
      percent: 15,
      desc: "Packed with essential daily nutrients and active ginseng to keep your immune system strong and your energy levels at their peak."
    },

    // Books Category
    {
      name: "Atomic Habits by James Clear",
      slug: "atomic-habits-james-clear",
      price: 289,
      compareAtPrice: 349,
      sku: "BK-ATOM-HABITS",
      category: "Books",
      brand: "Penguin Books",
      image: booksImageId,
      badge: "new",
      percent: 0,
      desc: "The landmark masterclass on building positive personal patterns and eradicating bad habits, holding millions of copies sold globally."
    },

    // Electronics & Gadgets
    {
      name: "Apple iPhone 15 Pro Max 256GB Titanium",
      slug: "apple-iphone-15-pro-max",
      price: 27999,
      compareAtPrice: 29999,
      sku: "EL-APP-IPH15PM",
      category: "Electronics & Gadgets",
      brand: "Apple",
      image: electronicsImageId,
      badge: "limited-time",
      percent: 7,
      desc: "Featuring a robust titanium body, advanced optical zoom camera, and the lightning-fast A17 Pro bionic chip for ultimate mobile processing."
    },
    {
      name: "Sony WH-1000XM5 Noise Cancelling Headphones",
      slug: "sony-wh-1000xm5-headphones",
      price: 6999,
      compareAtPrice: 7999,
      sku: "EL-SON-XM5HP",
      category: "Electronics & Gadgets",
      brand: "Sony",
      image: electronicsImageId,
      badge: "percent-off",
      percent: 12,
      desc: "Industry-defining noise cancellation combined with high-fidelity, luxurious sound engineering. Your sanctuary of sound awaits."
    }
  ];

  for (const p of PRODUCTS) {
    const pImage = p.image || fallbackImageId;
    const pDoc = {
      _type: "product",
      name: p.name,
      slug: { _type: "slug", current: `${p.slug}-${uuidv4().slice(0, 4)}` },
      sku: p.sku,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      inStock: true,
      stockCount: Math.floor(Math.random() * 40) + 10,
      rating: 4.5 + Math.random() * 0.5,
      reviewCount: Math.floor(Math.random() * 200) + 20,
      dealBadge: p.badge,
      dealPercent: p.percent,
      isFeatured: true,
      isBestSeller: Math.random() > 0.5,
      description: [
        {
          _type: 'block',
          children: [
            {
              _type: 'span',
              text: p.desc
            }
          ],
          markDefs: [],
          style: 'normal'
        }
      ],
      images: pImage ? [{ _type: "image", asset: { _ref: pImage } }] : [],
      category: { _type: "reference", _ref: categoryIdMap[p.category] },
      brand: { _type: "reference", _ref: brandIdMap[p.brand] },
      tags: [p.category.split(" ")[0], "Premium", "Official"]
    };

    const createdProduct = await client.create(pDoc);
    console.log(`Created product: ${createdProduct.name} in category ${p.category}`);
  }

  // 4. Create Hero Banner
  console.log("Creating hero banners...");
  const bannerDoc = {
    _type: "heroBanner",
    title: "Everyday Essentials & Tech",
    subtitle: "Premium electronics, local favorites, and wellness supplements shipped direct.",
    badge: "Special Launch",
    bgColor: "#0f172a",
    productImages: tvImageId ? [{ _type: "image", asset: { _ref: tvImageId } }] : [],
    ctaLabel: "Shop Deals Now",
    ctaHref: "/search?query=deal",
    isActive: true,
    sortOrder: 1
  };
  await client.create(bannerDoc);
  console.log("Created Hero Banner.");

  // 5. Create Homepage Sections for our cards
  console.log("Creating homepage sections...");
  
  const landingSection1 = {
    _type: "homepageSection",
    title: "Shop Headphones & Audio",
    variant: "hero",
    heroImage: electronicsImageId ? { _type: "image", asset: { _ref: electronicsImageId } } : undefined,
    cta: { label: "Explore Sound", href: "/search?query=headphones" },
    isActive: true,
    sortOrder: 1,
    locale: "both"
  };
  await client.create(landingSection1);

  const landingSection2 = {
    _type: "homepageSection",
    title: "Get 15% off your first order",
    variant: "promo",
    promoCode: "WELCOME15",
    promoDiscount: "15%",
    promoSubtext: "Use code at checkout. No minimum spend.",
    isActive: true,
    sortOrder: 2,
    locale: "both"
  };
  await client.create(landingSection2);

  const landingSection3 = {
    _type: "homepageSection",
    title: "Sign in for your best experience",
    variant: "auth",
    isActive: true,
    sortOrder: 3,
    locale: "both"
  };
  await client.create(landingSection3);

  console.log("Seeding process completed perfectly!");
}

seed().catch(console.error);
