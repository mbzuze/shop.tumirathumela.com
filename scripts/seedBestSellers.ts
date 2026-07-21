
import { createClient } from "next-sanity";
import path from "path";
import fs from "fs";

async function seedBestSellers() {
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

  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  const token = process.env.SANITY_API_TOKEN;

  const client = createClient({
    projectId,
    dataset,
    apiVersion: "2023-05-03",
    useCdn: false,
    token
  });

  console.log("Seeding Best Seller tags...");

  // Get all categories
  const categories = await client.fetch(`*[_type == "category"]{ _id, name }`);
  console.log(`Found ${categories.length} categories.`);

  for (const cat of categories) {
    // Get products in this category
    const products = await client.fetch(`*[_type == "product" && references($id)]{ _id, tags }`, { id: cat._id });
    
    if (products.length === 0) {
      console.log(`- No products in category: ${cat.name}`);
      continue;
    }

    console.log(`- Category ${cat.name}: found ${products.length} products. Seeding 2 Best Sellers...`);

    // Shuffle and pick 2
    const shuffled = products.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(2, products.length));

    for (const prod of selected) {
      const currentTags = prod.tags || [];
      const newTags = Array.from(new Set([...currentTags, "best-seller", "Best Seller"]));
      
      await client.patch(prod._id)
        .set({ 
          isBestSeller: true,
          tags: newTags
        })
        .commit();
      
      console.log(`  + Updated product ${prod._id} as Best Seller`);
    }
  }

  console.log("Best Seller seeding complete!");
}

seedBestSellers().catch(console.error);
