import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { EXCHANGE_COEFFICIENT } from "@/store/locationStore";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number,
  currency: string = "ZAR"
): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPrice(
  amountZAR: number,
  targetCurrency: "ZAR" | "USD" = "ZAR"
): string {
  let finalAmount = amountZAR;
  if (targetCurrency === "USD") {
    finalAmount = amountZAR * EXCHANGE_COEFFICIENT.ZAR_TO_USD * EXCHANGE_COEFFICIENT.ZIMBABWE_MARKUP;
  }

  const locale = targetCurrency === "ZAR" ? "en-ZA" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: targetCurrency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(finalAmount);
}
