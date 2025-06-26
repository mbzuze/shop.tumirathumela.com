import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const rawBody = await req.text();

    const id = req.headers.get("webhook-id") ?? "";
    const timestamp = req.headers.get("webhook-timestamp") ?? "";
    const signatureHeader = req.headers.get("webhook-signature") ?? "";

    const signedContent = `${id}.${timestamp}.${rawBody}`;

    const secret = process.env.YOCO_WEBHOOK_SECRET ?? "";
    const secretBytes = Buffer.from(secret.split("_")[1], "base64");

    const expectedSignature = crypto
      .createHmac("sha256", secretBytes)
      .update(signedContent)
      .digest("base64");

    const signatureParts = signatureHeader.split(" ");
    const signature =
      signatureParts.length > 0 ? signatureParts[0].split(",")[1] : "";

    // Console logs for debugging
    console.log("Received signature:", signature);
    console.log("Expected signature:", expectedSignature);
    console.log("Full webhook body:", rawBody);

    const valid =
      signature &&
      crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(signature),
      );

    if (valid) {
      // Parse the webhook payload
      const webhookData = JSON.parse(rawBody);
      console.log("Parsed webhook data:", webhookData);

      // Check if the payment was completed
      if (
        webhookData.type === "payment.succeeded" ||
        (webhookData.data && webhookData.data.status === "succeeded")
      ) {
        console.log("Payment completed successfully!");
        console.log("Payment ID:", webhookData.data?.id);
        console.log("Payment Amount:", webhookData.data?.amount);
        console.log("Payment Currency:", webhookData.data?.currency);

        // Add your payment completion logic here
        // For example: update database, send confirmation email, etc.
        try {
          const order = await createOrderInSanity(webhookData);
          console.log("Order created in Sanity:", order);
        } catch (error) {
          console.error("Error creating order in Sanity:", error);
          return new NextResponse("Error creating order", { status: 500 });
        }

        const successResponse = NextResponse.json({
          success: true,
          message: "Payment completed and processed",
        });
        console.log("Payment processed successfully - Response:", {
          success: true,
          message: "Payment completed and processed",
        });
        console.log("Webhook acknowledged - Response:", successResponse);
        return successResponse;
      } else {
        // Handle other webhook events (payment failed, pending, etc.)
        console.log(
          "Webhook received but payment not completed. Event type:",
          webhookData.type,
        );
        console.log("Payment status:", webhookData.data?.status);

        const acknowledgedResponse = NextResponse.json({
          success: true,
          message: "Webhook received but no action taken",
        });
        console.log("Webhook acknowledged - Response:", {
          success: true,
          message: "Webhook received but no action taken",
        });
        return acknowledgedResponse;
      }
    }

    return new NextResponse("Forbidden", { status: 403 });
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return new NextResponse("Invalid request", { status: 400 });
  }
}

async function createOrderInSanity(webhookData: any) {
  // Example: Use fetch to send a POST request to your Sanity API
  const SANITY_PROJECT_ID = process.env.SANITY_PROJECT_ID;
  const SANITY_DATASET = process.env.SANITY_DATASET;
  const SANITY_TOKEN = process.env.SANITY_API_TOKEN;

  if (!SANITY_PROJECT_ID || !SANITY_DATASET || !SANITY_TOKEN) {
    throw new Error("Sanity environment variables are not set");
  }

  // Construct the order document
  const orderDoc = {
    _type: "order",
    paymentId: webhookData.data?.id,
    amount: webhookData.data?.amount,
    currency: webhookData.data?.currency,
    status: webhookData.data?.status,
    createdAt: new Date().toISOString(),
    // Add more fields as needed
  };

  const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v2021-06-07/data/mutate/${SANITY_DATASET}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SANITY_TOKEN}`,
    },
    body: JSON.stringify({
      mutations: [{ create: orderDoc }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Sanity API error: ${errorText}`);
  }

  const result = await response.json();
  return result;
}
