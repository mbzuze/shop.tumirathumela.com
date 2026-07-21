"use server";

import { auth } from "@clerk/nextjs/server";
import {
  getAddressesByUser,
  getDefaultAddress,
  deleteAddress,
  setDefaultAddress,
} from "@/sanity/lib/addresses";
import type { CmsAddress as CustomerAddress } from "@/lib/cms-client";

export async function getMyAddressesAction(): Promise<CustomerAddress[]> {
  const { userId } = await auth();
  if (!userId) return [];
  return getAddressesByUser(userId);
}

export async function getMyDefaultAddressAction(): Promise<CustomerAddress | null> {
  const { userId } = await auth();
  if (!userId) return null;
  return getDefaultAddress(userId);
}

export async function deleteMyAddressAction(id: string): Promise<void> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const addresses = await getAddressesByUser(userId);
  const owns = addresses.some((a) => a.id === id);
  if (!owns) throw new Error("Unauthorized");

  await deleteAddress(id);
}

export async function setMyDefaultAddressAction(id: string): Promise<void> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const addresses = await getAddressesByUser(userId);
  const owns = addresses.some((a) => a.id === id);
  if (!owns) throw new Error("Unauthorized");

  await setDefaultAddress(id, userId);
}
