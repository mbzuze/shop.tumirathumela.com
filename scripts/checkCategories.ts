
import { createClient } from "next-sanity";
import path from "path";
import fs from "fs";

async function checkCategories() {
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

  const categories = await client.fetch(`*[_type == "category"]{ name, "slug": slug.current, parentCategory->{name} }`);
  console.log("Total Categories:", categories.length);
  categories.forEach((c: any) => {
    console.log(`- ${c.name} (${c.slug}) -> Parent: ${c.parentCategory?.name || 'None'}`);
  });
}


checkCategories().catch(console.error);
