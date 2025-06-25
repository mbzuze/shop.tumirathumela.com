import { NextResponse, NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";

type Item = {
  quantity: number;
  product: {
    _id: string;
    name?: string;
    price: number; // in base currency units (e.g. Rands)
    image?: string;
  };
};

export async function POST(request: NextRequest) {
  console.log("=== Webhook POST started ===");
  try {
    const requestBody = await request.json();
    console.log(
      "Full request body received:",
      JSON.stringify(requestBody, null, 2),
    );

    const { items, metadata, cancelUrl, failureUrl } = requestBody;

    // 1) Basic validation
    // if (!items?.length) {
    //   console.error("No items provided - items:", items);
    //   throw new Error("No items provided");
    // }

    // 2) Compute amounts (all in cents)
    // const subtotalAmount = items.reduce(
    //   (acc: number, { quantity, product }: Item) => {
    //     return acc + Math.round(product.price * 100) * quantity;
    //   },
    //   0,
    // );
    const totalDiscount = metadata.totalDiscount ?? 0;
    const totalTaxAmount = metadata.totalTax ?? 0;
    // const amount = subtotalAmount - totalDiscount + totalTaxAmount;

    // 3) Build lineItems for display in Yoco
    // const lineItems = items.map(({ quantity, product }: Item) => {
    //   const unitPrice = Math.round(product.price * 100);
    //   return {
    //     name: product.name || "Unnamed Product",
    //     quantity,
    //     unitPrice,
    //     totalAmount: unitPrice * quantity,
    //     description: `Product ID: ${product._id}`,
    //   };
    // });
    // 4) Generate Idempotency key
    const idempotencyKey = uuidv4();
    console.log("Idempotency key:", idempotencyKey);

    // 5) Call Yoco
    console.log("Calling YOCO API...");
    const resp = await fetch("https://payments.yoco.com/api/checkouts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.YOCO_SECRET_KEY}`,
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({
        amount: requestBody.amount,
        currency: "ZAR",
      }),
    });

    console.log("YOCO response status:", resp.status);
    console.log("YOCO response ok:", resp.ok);

    if (!resp.ok) {
      const errorText = await resp.text();
      console.error("YOCO error response:", errorText);
      throw new Error(`Yoco error: ${errorText}`);
    }

    const json = await resp.json();
    console.log("YOCO API response:", json);

    console.log("=== Webhook POST completed successfully ===");
    return NextResponse.json(json);
  } catch (err: any) {
    console.error("=== Webhook POST error ===");
    console.error("Error:", err);
    console.error("Error message:", err.message);
    console.error("Error stack:", err.stack);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
