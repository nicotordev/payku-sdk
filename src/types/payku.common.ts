import type { PaykuClientOptions } from "../errors";

export type PaykuEnvironment = "sandbox" | "production";

export type PaykuCurrency = "CLP" | "PEN" | "VES";

/** País operativo del comercio. Define currency por defecto y features disponibles. */
export type PaykuCountry = "CL" | "PE" | "VE";

export type PaykuOptions = PaykuClientOptions;

export const PAYKU_COUNTRY_CURRENCY = {
  CL: "CLP",
  PE: "PEN",
  VE: "VES",
} as const satisfies Record<PaykuCountry, PaykuCurrency>;

export type PaykuFeature =
  | "transactions"
  | "banks"
  | "paymentMethods"
  | "webhooks"
  | "wallet"
  | "wallet.withdraw"
  | "onSite"
  | "subscriptions"
  | "consumptionSubscriptions"
  | "marketplace"
  | "mall"
  | "events"
  | "escrow"
  | "nullification"
  | "conciliation";

export const PAYKU_COUNTRY_FEATURES = {
  CL: [
    "transactions",
    "banks",
    "paymentMethods",
    "webhooks",
    "wallet",
    "wallet.withdraw",
    "subscriptions",
    "consumptionSubscriptions",
    "marketplace",
    "mall",
    "events",
    "escrow",
    "nullification",
    "conciliation",
  ],
  PE: ["transactions", "banks", "paymentMethods", "webhooks", "wallet"],
  VE: [
    "transactions",
    "banks",
    "paymentMethods",
    "webhooks",
    "wallet",
    "onSite",
  ],
} as const satisfies Record<PaykuCountry, readonly PaykuFeature[]>;

export function getBaseUrl(environment: PaykuEnvironment): string {
  return environment === "production"
    ? "https://app.payku.cl/api"
    : "https://des.payku.cl/api";
}

export function getRootUrl(environment: PaykuEnvironment): string {
  return environment === "production"
    ? "https://app.payku.cl"
    : "https://des.payku.cl";
}

export interface PaykuPaginationParams {
  page?: number;
  per_page?: number;
}
