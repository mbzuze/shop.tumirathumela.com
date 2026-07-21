
import { createClient } from "next-sanity";
import path from "path";
import fs from "fs";

async function setupHierarchy() {
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

  console.log("Setting up category hierarchy...");

  // Get parent categories
  const electronics = await client.fetch(`*[_type == "category" && slug.current == "electronics"][0]`);
  const computerOffice = await client.fetch(`*[_type == "category" && slug.current == "computer-office"][0]`);

  if (!electronics || !computerOffice) {
    console.error("Parent categories not found. Run ensureCategories.ts first.");
    return;
  }

  const hierarchy = [
    { name: "Accessories", slug: "electronics-accessories", parent: electronics._id },
    { name: "Camera & Photo", slug: "camera-photo", parent: electronics._id },
    { name: "Car & Vehicle Electronics", slug: "car-electronics", parent: electronics._id },
    { name: "Cell Phones & Accessories", slug: "cell-phones", parent: electronics._id },
    { name: "Computers & Accessories", slug: "computers-accessories", parent: electronics._id },
    { name: "Laptops", slug: "laptops", parent: computerOffice._id },
    { name: "Desktops", slug: "desktops", parent: computerOffice._id },
    { name: "Monitors", slug: "monitors", parent: computerOffice._id },
    { name: "Printers & Ink", slug: "printers", parent: computerOffice._id },
  ];

  for (const item of hierarchy) {
    const existing = await client.fetch(`*[_type == "category" && slug.current == $slug][0]`, { slug: item.slug });
    if (!existing) {
      console.log(`Creating sub-category: ${item.name}`);
      await client.create({
        _type: "category",
        name: item.name,
        slug: { _type: "slug", current: item.slug },
        parentCategory: { _type: "reference", _ref: item.parent },
      });
    } else {
      console.log(`Sub-category exists: ${item.name}`);
      // Update parent if missing
      if (!existing.parentCategory) {
        await client.patch(existing._id).set({ parentCategory: { _type: "reference", _ref: item.parent } }).commit();
      }
    }
  }

  console.log("Hierarchy setup complete!");
}

setupHierarchy().catch(console.error);
