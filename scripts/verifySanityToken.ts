import { createClient } from "next-sanity";
// import * as dotenv from "dotenv";
// dotenv.config({ path: ".env.local" });

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_API_TOKEN;

console.log("Verifying Sanity configuration:");
console.log("Project ID:", projectId);
console.log("Dataset:", dataset);
console.log("Token length:", token ? token.length : 0);

if (!projectId || !dataset || !token) {
  console.error("Missing configuration");
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2023-05-03",
  useCdn: false,
  token,
});

async function verify() {
  try {
    console.log("Attempting to fetch a document...");
    const doc = await client.fetch('*[_type == "order"][0]');
    console.log("Success! Fetched document:", doc ? doc._id : "No orders found");
  } catch (error: any) {
    console.error("Error verifying token:", error.message);
    if (error.response) {
        console.error("Status:", error.response.statusCode);
        console.error("Body:", error.response.body);
    }
  }
}

verify();
