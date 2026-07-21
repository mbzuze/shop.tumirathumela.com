
import { createClient } from "next-sanity";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

async function ensureCategories() {
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

  const mainCategories = [
    { name: "Beauty", slug: "beauty" },
    { name: "Books", slug: "books" },
    { name: "Computer & Office", slug: "computer-office" },
    { name: "Electronics", slug: "electronics" },
    { name: "Home & Kitchen", slug: "home-kitchen" },
    // Extra categories mentioned or implied
    { name: "Movies & TV", slug: "movies-tv" },
    { name: "Clothing", slug: "clothing" },
    { name: "Baby", slug: "baby" },
    { name: "Toys & Games", slug: "toys-games" },
    { name: "Food & Groceries", slug: "food-groceries" },
    { name: "Pet Supplies", slug: "pet-supplies" },
    { name: "Sports & Outdoors", slug: "sports-outdoors" },
  ];

  console.log("Checking and ensuring categories...");

  for (const cat of mainCategories) {
    const existing = await client.fetch(`*[_type == "category" && slug.current == $slug][0]`, { slug: cat.slug });
    
    if (!existing) {
      console.log(`Creating category: ${cat.name}`);
      await client.create({
        _type: "category",
        name: cat.name,
        slug: { _type: "slug", current: cat.slug },
        description: `Shop our latest selection of ${cat.name}.`,
      });
    } else {
      console.log(`Category exists: ${cat.name}`);
    }
  }

  console.log("Done!");
}

ensureCategories().catch(console.error);
