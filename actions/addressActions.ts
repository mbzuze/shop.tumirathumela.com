"use server";

import { auth } from "@clerk/nextjs/server";
import {
  getAddressesByUser,
  getDefaultAddress,
  deleteAddress,
  setDefaultAddress,
  type CustomerAddress,
} from "@/sanity/lib/addresses";

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
  
  // Security check: verify the user owns this address before deleting
  const addresses = await getAddressesByUser(userId);
  const owns = addresses.some((a) => a._id === id);
  if (!owns) throw new Error("Unauthorized");
  
  await deleteAddress(id);
}

export async function setMyDefaultAddressAction(id: string): Promise<void> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  
  // Security check: verify the user owns this address
  const addresses = await getAddressesByUser(userId);
  const owns = addresses.some((a) => a._id === id);
  if (!owns) throw new Error("Unauthorized");
  
  await setDefaultAddress(id, userId);
}
