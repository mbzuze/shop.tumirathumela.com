import https from "https";

const secretKey = process.env.YOCO_SECRET_KEY;
const webhookUrl = process.argv[2];

if (!secretKey) {
  console.error("Error: YOCO_SECRET_KEY environment variable is not set.");
  process.exit(1);
}

if (!webhookUrl) {
  console.error("Error: Please provide the webhook URL as an argument.");
  console.log("Usage: npx ts-node scripts/registerYocoWebhook.ts <url>");
  process.exit(1);
}

const data = JSON.stringify({
  name: "Next.js Store Webhook",
  url: webhookUrl,
});

const options = {
  hostname: "payments.yoco.com",
  path: "/api/webhooks",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${secretKey}`,
    "Content-Length": data.length,
  },
};

const req = https.request(options, (res) => {
  let responseData = "";

  res.on("data", (chunk) => {
    responseData += chunk;
  });

  res.on("end", () => {
    if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
      try {
        const json = JSON.parse(responseData);
        console.log("Webhook registered successfully!");
        console.log(JSON.stringify(json, null, 2));
      } catch (e) {
        console.error("Error parsing JSON response:", e);
        console.log("Raw response:", responseData);
      }
    } else {
      console.error(`Request failed with status code: ${res.statusCode}`);
      console.error("Response body:", responseData);
    }
  });
});

req.on("error", (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(data);
req.end();
