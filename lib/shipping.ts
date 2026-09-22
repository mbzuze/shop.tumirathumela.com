/**
 * Single source of truth for delivery pricing and VAT display.
 *
 * The checkout page imports these same constants to render prices, and
 * app/api/checkout/route.ts imports them to compute the amount actually
 * charged — so the displayed price and the charged price cannot drift the
 * way they used to (each had its own hardcoded copy).
 *
 * Listed product prices are VAT-inclusive. VAT is never added on top; it is
 * only ever displayed as the included component of a total.
 */

export type Country = "ZA" | "ZW";
export type DeliverySpeed = "standard" | "express";

export const VAT_RATE = 0.15;

/**
 * Standard is genuinely free for ZA — the old R100 "base" was fictional
 * (charged regardless of the delivery speed shown as "FREE"). ZW keeps a
 * real cross-border cost. Express is not offered for ZW: a 1–2 business-day
 * courier into Zimbabwe isn't something this business can fulfil, and
 * selling a promise that will be missed invites chargebacks rather than
 * revenue.
 */
export const SHIPPING_ZAR: Record<Country, { standard: number; express: number | null }> = {
  ZA: { standard: 0, express: 99 },
  ZW: { standard: 350, express: null },
};

export function shippingFor(country: Country, speed: DeliverySpeed): number {
  const rate = SHIPPING_ZAR[country][speed];
  if (rate === null) {
    throw new Error(`${speed} delivery is not offered for ${country}`);
  }
  return rate;
}

export function shippingCentsFor(country: Country, speed: DeliverySpeed): number {
  return Math.round(shippingFor(country, speed) * 100);
}

export function isSpeedAvailable(country: Country, speed: DeliverySpeed): boolean {
  return SHIPPING_ZAR[country][speed] !== null;
}

/** The VAT portion already included in a VAT-inclusive amount, in cents. */
export function vatIncludedCents(totalCents: number): number {
  return Math.round(totalCents - totalCents / (1 + VAT_RATE));
}
