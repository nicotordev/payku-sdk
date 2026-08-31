import type {
  PaykuCreateTransactionRequest,
  PaykuCreateTransactionResponse,
} from "../types/payku.transactions";
import type { PaykuCurrency } from "../types/payku.common";
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
