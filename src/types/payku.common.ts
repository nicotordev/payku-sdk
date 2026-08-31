import type { PaykuClientOptions } from "../errors";

export type PaykuEnvironment = "sandbox" | "production";

export type PaykuCurrency = "CLP" | "PEN" | "VES";

export type PaykuOptions = PaykuClientOptions;

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
