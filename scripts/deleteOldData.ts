import { createClient } from "next-sanity";
import fs from "fs";
import path from "path";

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
} catch (err) {}

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_API_TOKEN;

if (!projectId || !dataset || !token) {
  console.error("Missing Sanity configuration.");
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2023-05-03",
  useCdn: false,
  token,
});

async function deleteOldData() {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const isoDate = oneMonthAgo.toISOString();

  console.log(`Deleting ALL data older than 1 month (${isoDate})...`);

  // Phased order of document types
  const phases = [
    ["order", "sale", "customerAddress", "homepageSection", "heroBanner"],
    ["product", "productVariant"],
    ["category", "brand", "deal", "sales"],
    ["sanity.imageAsset", "sanity.fileAsset"]
  ];

  for (let phaseIndex = 0; phaseIndex < phases.length; phaseIndex++) {
    const types = phases[phaseIndex];
    const typesString = JSON.stringify(types);
    const query = `*[_createdAt < $date && _type in ${typesString}] { _id, _type }`;
    const docs = await client.fetch(query, { date: isoDate });

    if (docs.length === 0) {
      console.log(`Phase ${phaseIndex + 1} (${types.join(", ")}): No documents to delete.`);
      continue;
    }

    console.log(`Phase ${phaseIndex + 1} (${types.join(", ")}): Deleting ${docs.length} documents...`);

    for (const doc of docs) {
      try {
        // Check for incoming references
        const refs = await client.fetch(`*[references($id)] { _id, _type, orderItems, applicableProducts, category, brand, images, heroImage, productImages }`, { id: doc._id });
        if (refs.length > 0) {
          console.log(`  Document ${doc._id} (${doc._type}) is referenced by ${refs.length} documents. Unsetting references...`);
          for (const refDoc of refs) {
            const patch = client.patch(refDoc._id);
            let hasPatch = false;

            if (refDoc._type === "order" && refDoc.orderItems) {
              const itemsToRemove = refDoc.orderItems
                .map((item: any, idx: number) => item.product?._ref === doc._id ? `orderItems[${idx}]` : null)
                .filter(Boolean);
              if (itemsToRemove.length > 0) {
                patch.unset(itemsToRemove);
                hasPatch = true;
              }
            }

            if (refDoc.applicableProducts) {
              const itemsToRemove = refDoc.applicableProducts
                .map((item: any, idx: number) => item._ref === doc._id ? `applicableProducts[${idx}]` : null)
                .filter(Boolean);
              if (itemsToRemove.length > 0) {
                patch.unset(itemsToRemove);
                hasPatch = true;
              }
            }

            if (refDoc.category?._ref === doc._id) {
              patch.unset(["category"]);
              hasPatch = true;
            }

            if (refDoc.brand?._ref === doc._id) {
              patch.unset(["brand"]);
              hasPatch = true;
            }

            if (refDoc.images) {
              const itemsToRemove = refDoc.images
                .map((item: any, idx: number) => item.asset?._ref === doc._id ? `images[${idx}]` : null)
                .filter(Boolean);
              if (itemsToRemove.length > 0) {
                patch.unset(itemsToRemove);
                hasPatch = true;
              }
            }

            if (refDoc.productImages) {
              const itemsToRemove = refDoc.productImages
                .map((item: any, idx: number) => item.asset?._ref === doc._id ? `productImages[${idx}]` : null)
                .filter(Boolean);
              if (itemsToRemove.length > 0) {
                patch.unset(itemsToRemove);
                hasPatch = true;
              }
            }

            if (refDoc.heroImage?.asset?._ref === doc._id) {
              patch.unset(["heroImage"]);
              hasPatch = true;
            }

            if (hasPatch) {
              await patch.commit();
            }
          }
        }

        // Delete document
        await client.delete(doc._id);
      } catch (err: any) {
        console.error(`  Failed to delete document ${doc._id}:`, err.message);
      }
    }
  }

  console.log("Deletion completed successfully across all phases.");
}

deleteOldData().catch(console.error);
