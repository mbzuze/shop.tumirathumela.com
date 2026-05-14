import https from "https";

const secretKey = process.env.YOCO_SECRET_KEY;

if (!secretKey) {
  console.error("Error: YOCO_SECRET_KEY environment variable is not set.");
  process.exit(1);
}

const options = {
  hostname: "payments.yoco.com",
  path: "/api/webhooks",
  method: "GET",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${secretKey}`,
  },
};

const req = https.request(options, (res) => {
  let data = "";

  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
      try {
        const json = JSON.parse(data);
        console.log("Registered Webhooks:");
        console.log(JSON.stringify(json, null, 2));
      } catch (e) {
        console.error("Error parsing JSON response:", e);
        console.log("Raw response:", data);
      }
    } else {
      console.error(`Request failed with status code: ${res.statusCode}`);
      console.error("Response body:", data);
    }
  });
});

req.on("error", (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();
