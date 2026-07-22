"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createAddress } from "@/lib/cms-client";

export async function addAddressAction(formData: FormData) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const isDefault = formData.get("isDefault") === "on";
  const phonePrefix = (formData.get("phonePrefix") as string) || "+27";
  const phoneNumber = (formData.get("phoneNumber") as string) || "";

  await createAddress({
    clerkUserId: userId,
    fullName: formData.get("fullName") as string,
    phone: `${phonePrefix}${phoneNumber}`,
    streetAddress: formData.get("streetAddress") as string,
    buildingDetails: (formData.get("buildingDetails") as string) || null,
    suburb: (formData.get("suburb") as string) || null,
    city: formData.get("city") as string,
    province: (formData.get("province") as string) || null,
    postalCode: formData.get("postalCode") as string,
    country: formData.get("country") as "ZA" | "ZW",
    isDefault,
    addressType: (formData.get("addressType") as string) || null,
    deliveryInstructions: (formData.get("deliveryInstructions") as string) || null,
  });

  redirect("/account/addresses");
}
