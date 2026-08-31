import type {
  PaykuCreateTransactionRequest,
  PaykuCreateTransactionResponse,
} from "../types/payku.transactions";
import type { PaykuMarketplaceAffiliationPair } from "../types/payku.marketplace";
import type { PaykuCurrency } from "../types/payku.common";
import type { PaykuMallMerchantTuple } from "../types/payku.mall";
import {
  PAYKU_PAYMENT_METHODS,
  PAYKU_VES_GATEWAYS,
} from "../constants/payku.constants";
import { PaykuError } from "../errors";

export function buildPaymentRedirectUrl(
  response: Pick<PaykuCreateTransactionResponse, "url">,
): string {
  return response.url;
}

/** Construye la tupla `merchant[]` esperada por `POST /api/mall`. */
export function buildMallMerchant(params: {
  tokenOrAffiliationId: string;
  amount: string | number;
  subject: string;
  eventId?: string | null;
  individualOrder: string;
}): PaykuMallMerchantTuple {
  return [
    params.tokenOrAffiliationId,
    params.amount,
    params.subject,
    params.eventId ?? null,
    params.individualOrder,
  ];
}

export function toQueryRecord(
  params: object,
): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      query[key] = value as string | number | boolean;
    }
  }

  return query;
}

export function isNoRecordsErrorMessage(message: string): boolean {
  return message.toLowerCase().includes("there are no records");
}

export function bodyAsRecord<T extends object>(
  value: T,
): Record<string, unknown> {
  return value as unknown as Record<string, unknown>;
}

export function validateCreateTransactionRequest(
  params: PaykuCreateTransactionRequest,
): void {
  if (params.amount <= 0) {
    throw new PaykuError("amount must be greater than 0");
  }

  if (params.payment !== undefined) {
    const validCodes: number[] = Object.values(
      PAYKU_PAYMENT_METHODS[params.currency as PaykuCurrency],
    );

    if (!validCodes.includes(params.payment)) {
      throw new PaykuError(
        `payment ${params.payment} is not valid for currency ${params.currency}`,
      );
    }
  }

  const gateway = params.additional_parameters?.gateway;

  if (params.currency === "VES" && gateway !== undefined) {
    const validGateways = Object.values(PAYKU_VES_GATEWAYS);

    if (!validGateways.includes(gateway as (typeof validGateways)[number])) {
      throw new PaykuError(`Unknown VES gateway: ${gateway}`);
    }
  }
}

/** Construye pares `[clientId, percentage]` para `affiliation`. */
export function buildMarketplaceAffiliation(
  members: Array<{ clientId: string; percentage: string | number }>,
): PaykuMarketplaceAffiliationPair[] {
  return members.map((member) => [
    member.clientId,
    String(member.percentage),
  ]);
}

/**
 * Valida que % comercio + % clientes ≈ 100 (tolerancia 0.01).
 * Docs: percentage es del comercio; affiliation[] son clientes.
 */
export function validateMarketplaceAffiliationPercentages(
  merchantPercentage: string | number,
  affiliation: PaykuMarketplaceAffiliationPair[],
): void {
  const merchant = Number(merchantPercentage);
  const clients = affiliation.reduce(
    (sum, [, pct]) => sum + Number(pct),
    0,
  );
  const total = merchant + clients;

  // Tolerancia documentada 0.01 + epsilon FP (p. ej. 20 + 79.99).
  const tolerance = 0.01 + Number.EPSILON * Math.max(1, Math.abs(total), 100);
  if (Number.isNaN(total) || Math.abs(total - 100) > tolerance) {
    throw new PaykuError(
      `marketplace affiliation percentages must sum to 100 (got ${total})`,
    );
  }
}
