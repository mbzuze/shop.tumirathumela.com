import { createClient } from "next-sanity";
import { v4 as uuidv4 } from "uuid";
import { faker } from "@faker-js/faker";
import fs from "fs";
import path from "path";

// 1. Setup Environment & Client
try {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, "utf-8");
    envConfig.split("\n").forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || "";
        if (value.startsWith('"') && value.endsWith('"')) value = value.substring(1, value.length - 1);
        process.env[key] = value;
      }
    });
  }
} catch (err) {}

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_API_TOKEN;

if (!projectId || !dataset || !token) {
  console.error("Missing Sanity configuration (PROJECT_ID, DATASET, or TOKEN).");
  process.exit(1);
}

const client = createClient({ 
  projectId, 
  dataset, 
  apiVersion: "2023-05-03", 
  useCdn: false, 
  token 
});

// 2. Data Reference from plan.md
const CATEGORY_MAP: Record<string, string[]> = {
  "Electronics": ["Smartphones", "Laptops", "Headphones", "Smartwatches", "Accessories"],
  "Clothing & Apparel": ["Men's Wear", "Women's Wear", "Kids", "Activewear", "Shoes"],
  "Home & Garden": ["Furniture", "Kitchen", "Bedding", "Decor", "Garden"],
  "Beauty & Health": ["Skincare", "Makeup", "Haircare", "Wellness", "Fragrances"],
  "Sports & Outdoors": ["Camping", "Cycling", "Fitness", "Outdoor Gear", "Water Sports"],
  "Books & Media": ["Fiction", "Non-Fiction", "Self-Help", "Magazines", "Music"],
  "Toys & Games": ["Board Games", "Action Figures", "Educational", "Puzzles", "Outdoor Toys"],
  "Automotive": ["Car Parts", "Car Care", "Accessories", "Electronics", "Tools"],
  "Food & Groceries": ["Pantry", "Snacks", "Organic", "Beverages", "Fresh"],
  "Office Supplies": ["Stationery", "Furniture", "Technology", "Paper", "Organization"]
};

const IMAGE_KEYWORDS: Record<string, string[]> = {
  "Smartphones": ["smartphone", "iphone", "android-phone"],
  "Laptops": ["laptop", "macbook", "computer"],
  "Headphones": ["headphones", "earbuds", "audio"],
  "Clothing & Apparel": ["fashion", "clothing", "model"],
  "Shoes": ["running-shoes", "sneakers", "nike"],
  "Home & Garden": ["furniture", "sofa", "decor"],
  "Beauty & Health": ["skincare", "beauty", "cosmetics"],
  "Sports & Outdoors": ["cycling", "fitness", "mountain-bike"],
  "Books & Media": ["book", "library", "reading"],
  "Toys & Games": ["toy", "lego", "gaming"]
};

const REAL_BRANDS = [
  "Samsung", "Nike", "Apple", "IKEA", "Dyson", "Sony", "Adidas", "Bose", "Dell", "LG",
  "HP", "Logitech", "Canon", "Nikon", "Microsoft", "Asus", "Lenovo", "Zara", "H&M", "Levi's",
  "North Face", "Patagonia", "Under Armour", "Lululemon", "Puma", "Reebok", "Philips", "Oral-B",
  "Braun", "KitchenAid", "Nespresso", "Breville", "Fitbit", "Garmin", "Xiaomi", "Huawei", "Oppo",
  "Vivo", "Realme", "Nintendo", "Lego", "Hasbro", "Mattel", "Fisher-Price", "Barbie", "Disney",
  "Tesla", "Ford", "Toyota", "BMW", "Mercedes-Benz", "Audi", "Volkswagen", "Honda", "Hyundai", "Kia"
];

// 3. Helpers
const imageCache: Record<string, string> = {};

async function uploadImage(keyword: string) {
  const url = `https://source.unsplash.com/800x800/?${encodeURIComponent(keyword)}`;
  if (imageCache[keyword]) return imageCache[keyword];
  
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const asset = await client.assets.upload('image', Buffer.from(buffer), { 
      filename: `${keyword.replace(/\s+/g, '-')}-${uuidv4().slice(0, 8)}.jpg` 
    });
    imageCache[keyword] = asset._id;
    return asset._id;
  } catch (e) {
    return null;
  }
}

async function seed() {
  console.log("🚀 Starting Comprehensive Seeding (TumiraThumela Shop)...");

  // --- SECTION 1: Categories & Brands ---
  console.log("📦 Seeding Categories and Brands...");
  const categoriesDocs: any[] = [];
  const subCategoriesDocs: any[] = [];
  
  for (const [parentName, subs] of Object.entries(CATEGORY_MAP)) {
    const parentId = `category-${uuidv4()}`;
    const keyword = parentName.split(' ')[0].toLowerCase();
    const imgId = await uploadImage(keyword);
    
    const parentDoc = {
      _id: parentId,
      _type: 'category',
      name: parentName,
      slug: { _type: 'slug', current: faker.helpers.slugify(parentName).toLowerCase() },
      description: `Shop the best in ${parentName}.`,
      image: imgId ? { _type: 'image', asset: { _ref: imgId } } : undefined,
      sortOrder: categoriesDocs.length
    };
    categoriesDocs.push(parentDoc);

    for (const subName of subs) {
      const subId = `category-${uuidv4()}`;
      const subDoc = {
        _id: subId,
        _type: 'category',
        name: subName,
        slug: { _type: 'slug', current: faker.helpers.slugify(subName).toLowerCase() + '-' + uuidv4().slice(0,4) },
        description: `Premium ${subName} products.`,
        parentCategory: { _type: 'reference', _ref: parentId },
        sortOrder: subCategoriesDocs.length
      };
      subCategoriesDocs.push(subDoc);
    }
  }

  const brandDocs = REAL_BRANDS.map((name, i) => ({
    _id: `brand-${uuidv4()}`,
    _type: 'brand',
    name: name,
    slug: { _type: 'slug', current: faker.helpers.slugify(name).toLowerCase() },
    isAuthorisedReseller: true,
    sortOrder: i
  }));

  await client.transaction().createOrReplace(categoriesDocs[0]).commit(); // Test single commit
  console.log("Submitting Categories, Brands...");
  const batch1 = [...categoriesDocs, ...subCategoriesDocs, ...brandDocs];
  for (let i = 0; i < batch1.length; i += 100) {
    const trx = client.transaction();
    batch1.slice(i, i + 100).forEach(doc => trx.createOrReplace(doc));
    await trx.commit();
  }

  // --- SECTION 2: Customers & Addresses ---
  console.log("👤 Seeding 500 Customers and 750 Addresses...");
  const customers: any[] = [];
  const addressDocs: any[] = [];
  
  for (let i = 0; i < 500; i++) {
    const clerkUserId = `user_${faker.string.alphanumeric(20)}`;
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const name = `${firstName} ${lastName}`;
    const email = faker.internet.email({ firstName, lastName });
    const phone = faker.phone.number();
    
    customers.push({ clerkUserId, name, email, phone });

    const addrCount = faker.number.int({ min: 1, max: 2 });
    for (let j = 0; j < addrCount; j++) {
      addressDocs.push({
        _id: `address-${uuidv4()}`,
        _type: 'customerAddress',
        clerkUserId,
        fullName: name,
        phone: phone,
        streetAddress: faker.location.streetAddress(),
        city: faker.location.city(),
        province: faker.location.state(),
        postalCode: faker.location.zipCode(),
        country: "South Africa",
        isDefault: j === 0,
        addressType: j === 0 ? 'shipping' : 'billing'
      });
    }
  }

  for (let i = 0; i < addressDocs.length; i += 100) {
    const trx = client.transaction();
    addressDocs.slice(i, i + 100).forEach(doc => trx.createOrReplace(doc));
    await trx.commit();
  }

  // --- SECTION 3: Products ---
  console.log("🛍️ Seeding 300 Products...");
  const productDocs: any[] = [];
  
  for (let i = 0; i < 300; i++) {
    const subCat = faker.helpers.arrayElement(subCategoriesDocs);
    const brand = faker.helpers.arrayElement(brandDocs);
    const name = faker.commerce.productName();
    const basePrice = parseFloat(faker.commerce.price({ min: 150, max: 15000 }));
    
    // Get relevant image keywords
    const keywords = IMAGE_KEYWORDS[subCat.name] || [subCat.name.toLowerCase(), "product"];
    const imgId = await uploadImage(faker.helpers.arrayElement(keywords));

    const pDoc = {
      _id: `product-${uuidv4()}`,
      _type: 'product',
      name: name,
      slug: { _type: 'slug', current: faker.helpers.slugify(name).toLowerCase() + '-' + uuidv4().slice(0, 4) },
      sku: `SKU-${faker.string.alphanumeric(8).toUpperCase()}`,
      price: basePrice,
      compareAtPrice: basePrice * 1.3,
      brand: { _type: 'reference', _ref: brand._id },
      category: { _type: 'reference', _ref: subCat._id },
      inStock: true,
      stockCount: faker.number.int({ min: 10, max: 1000 }),
      description: [
        {
          _type: 'block',
          children: [{ _type: 'span', text: faker.commerce.productDescription() }],
          markDefs: [],
          style: 'normal'
        }
      ],
      images: imgId ? [{ _type: 'image', asset: { _ref: imgId } }] : [],
      isFeatured: i < 30,
      rating: faker.number.float({ min: 3.5, max: 5.0, fractionDigits: 1 }),
      reviewCount: faker.number.int({ min: 5, max: 200 })
    };
    productDocs.push(pDoc);
  }

  for (let i = 0; i < productDocs.length; i += 50) {
    const trx = client.transaction();
    productDocs.slice(i, i + 50).forEach(doc => trx.createOrReplace(doc));
    await trx.commit();
    process.stdout.write(".");
  }

  // --- SECTION 5: Reviews ---
  console.log("\n⭐ Seeding 2000 Reviews...");
  const reviewDocs: any[] = [];
  for (let i = 0; i < 2000; i++) {
    const product = faker.helpers.arrayElement(productDocs);
    const customer = faker.helpers.arrayElement(customers);
    const rating = faker.helpers.weightedArrayElement([
      { weight: 45, value: 5 },
      { weight: 30, value: 4 },
      { weight: 15, value: 3 },
      { weight: 7, value: 2 },
      { weight: 3, value: 1 }
    ]);

    reviewDocs.push({
      _id: `review-${uuidv4()}`,
      _type: 'review',
      product: { _type: 'reference', _ref: product._id },
      clerkUserId: customer.clerkUserId,
      authorName: customer.name.split(' ')[0],
      rating: rating,
      title: faker.word.adjective() + " " + faker.word.noun(),
      body: faker.lorem.paragraph(),
      isVerifiedPurchase: faker.datatype.boolean(0.8),
      helpfulVotes: faker.number.int({ min: 0, max: 50 }),
      createdAt: faker.date.past().toISOString()
    });
  }

  for (let i = 0; i < reviewDocs.length; i += 100) {
    const trx = client.transaction();
    reviewDocs.slice(i, i + 100).forEach(doc => trx.createOrReplace(doc));
    await trx.commit();
  }

  // --- SECTION 6: Orders ---
  console.log("\n🛒 Seeding 1500 Orders...");
  const orderDocs: any[] = [];
  for (let i = 0; i < 1500; i++) {
    const customer = faker.helpers.arrayElement(customers);
    const itemCount = faker.number.int({ min: 1, max: 4 });
    const orderItems: any[] = [];
    let subtotal = 0;
    
    for (let j = 0; j < itemCount; j++) {
      const p = faker.helpers.arrayElement(productDocs);
      const qty = faker.number.int({ min: 1, max: 2 });
      orderItems.push({
        _key: uuidv4(),
        product: { _type: 'reference', _ref: p._id },
        quantity: qty
      });
      subtotal += (p.price * qty);
    }

    orderDocs.push({
      _id: `order-${uuidv4()}`,
      _type: 'order',
      orderNumber: `ORD-2024-${faker.string.numeric(6)}`,
      clerkUserId: customer.clerkUserId,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      customerAddress: faker.location.streetAddress(),
      customerCity: faker.location.city(),
      customerState: faker.location.state(),
      orderDate: faker.date.past().toISOString(),
      orderItems: orderItems,
      total: subtotal,
      status: faker.helpers.arrayElement(['pending', 'processing', 'completed', 'cancelled']),
      yocoPaymentId: `ch_${faker.string.alphanumeric(20)}`
    });
  }

  for (let i = 0; i < orderDocs.length; i += 100) {
    const trx = client.transaction();
    orderDocs.slice(i, i + 100).forEach(doc => trx.createOrReplace(doc));
    await trx.commit();
  }

  // --- SECTION 9: Wishlists ---
  console.log("\n❤️ Seeding 800 Wishlist entries...");
  const wishlistDocs: any[] = [];
  const wishlistSet = new Set();
  
  while (wishlistDocs.length < 800) {
    const customer = faker.helpers.arrayElement(customers);
    const product = faker.helpers.arrayElement(productDocs);
    const key = `${customer.clerkUserId}-${product._id}`;
    
    if (!wishlistSet.has(key)) {
      wishlistSet.add(key);
      wishlistDocs.push({
        _id: `wishlist-${uuidv4()}`,
        _type: 'wishlist',
        clerkUserId: customer.clerkUserId,
        product: { _type: 'reference', _ref: product._id },
        addedAt: faker.date.recent().toISOString()
      });
    }
  }

  for (let i = 0; i < wishlistDocs.length; i += 100) {
    const trx = client.transaction();
    wishlistDocs.slice(i, i + 100).forEach(doc => trx.createOrReplace(doc));
    await trx.commit();
  }

  console.log("\n✅ Comprehensive seeding from plan.md completed!");
}

seed().catch(console.error);
