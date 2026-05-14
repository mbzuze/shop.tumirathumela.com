import https from "https";

const secretKey = process.env.YOCO_SECRET_KEY;
const webhookId = process.argv[2];

if (!secretKey) {
  console.error("Error: YOCO_SECRET_KEY environment variable is not set.");
  process.exit(1);
}

if (!webhookId) {
  console.error("Error: Please provide the webhook ID as an argument.");
  console.log("Usage: npx ts-node scripts/deleteYocoWebhook.ts <id>");
  process.exit(1);
}

const options = {
  hostname: "payments.yoco.com",
  path: `/api/webhooks/${webhookId}`,
  method: "DELETE",
  headers: {
    Authorization: `Bearer ${secretKey}`,
  },
};

const req = https.request(options, (res) => {
  let responseData = "";

  res.on("data", (chunk) => {
    responseData += chunk;
  });

  res.on("end", () => {
    if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
      console.log("Webhook deleted successfully!");
    } else {
      console.error(`Request failed with status code: ${res.statusCode}`);
      console.error("Response body:", responseData);
    }
  });
});

req.on("error", (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();
