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

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2023-05-03",
  useCdn: false,
  token,
});

async function check() {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const isoDate = oneMonthAgo.toISOString();

  const query = `*[_createdAt < "${isoDate}"] { _id, _type, _createdAt, name, title, orderNumber }`;
  const docs = await client.fetch(query);

  console.log("Older than 1 month docs sample:");
  docs.slice(0, 15).forEach((d: any) => {
    console.log(`- Type: ${d._type}, ID: ${d._id}, Created: ${d._createdAt}, Identifier: ${d.name || d.title || d.orderNumber || 'N/A'}`);
  });
}

check();
