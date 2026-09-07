import type { PaykuCurrency } from "../types/payku.common";
import type { PaykuEventAffiliationTuple } from "../types/payku.events";
import type { PaykuMallMerchantTuple } from "../types/payku.mall";
import type {
  PaykuCreateMarketplaceAffiliationRequest,
  PaykuCreateMarketplaceClientRequest,
  PaykuMarketplaceAffiliationPair,
  PaykuMarketplaceTransactionRequest,
} from "../types/payku.marketplace";
import type {
  PaykuChileCreateTransactionRequest,
  PaykuCreateTransactionRequest,
  PaykuCreateTransactionResponse,
  PaykuListTransactionsParams,
} from "../types/payku.transactions";
import type { PaykuNullificationCreateRequest } from "../types/payku.nullification";
import type {
  PaykuCreateSubscriptionClientRequest,
  PaykuCreateSubscriptionRequest,
  PaykuCreateSubscriptionTransactionRequest,
  PaykuListSubscriptionClientsParams,
} from "../types/payku.subscriptions";
import {
  PAYKU_CLP_CREATE_PAYMENT_CODES,
  PAYKU_CLP_PAYMENTS_REQUIRING_PAYER_RUT,
  PAYKU_LIST_TRANSACTIONS_MAX_PER_PAGE,
  PAYKU_PAYMENT_METHODS,
  PAYKU_VES_GATEWAYS,
} from "../constants/payku.constants";
import { PaykuError } from "../errors";
import type { PaykuTransactionStatus } from "../types/payku.responses";

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

/** Construye tuplas `[email, percent]` para `POST /api/event`. */
export function buildEventAffiliation(
  members: Array<{ email: string; percent: number }>,
): PaykuEventAffiliationTuple[] {
  return members.map((member) => [member.email, member.percent]);
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

function requireNonEmptyField(value: unknown, field: string): void {
  if (value === undefined || value === null || String(value).trim() === "") {
    throw new PaykuError(`${field} is required`);
  }
}

function requireStringField(
  value: unknown,
  field: string,
  maxLength?: number,
): void {
  if (typeof value !== "string" || value.trim() === "") {
    throw new PaykuError(`${field} is required`);
  }
  if (maxLength !== undefined && value.length > maxLength) {
    throw new PaykuError(`${field} must be at most ${maxLength} characters`);
  }
}

/** Docs Chile: `expired` wall-clock en hora Santiago. */
const PAYKU_EXPIRED_FORMAT = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
const PAYKU_SANTIAGO_TZ = "America/Santiago";
const PAYKU_EXPIRED_MIN_MARGIN_MS = 5 * 60 * 1000;


function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function readDateTimeParts(parts: Intl.DateTimeFormatPart[]): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
} {
  const get = (type: Intl.DateTimeFormatPartTypes): number => {
    const part = parts.find((entry) => entry.type === type)?.value;
    return Number(part);
  };

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

/**
 * Interpreta `YYYY-MM-DD HH:mm:ss` como hora local America/Santiago.
 * Usa `Intl` (sin deps); el offset puede variar por DST histórico de Chile.
 */
export function parsePaykuExpiredInSantiago(expired: string): Date {
  const [datePart, timePart] = expired.split(" ");
  const [year, month, day] = datePart!.split("-").map(Number);
  const [hour, minute, second] = timePart!.split(":").map(Number);

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: PAYKU_SANTIAGO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  // Ajuste iterativo: tratar los dígitos como UTC y corregir con el wall-clock Santiago.
  let utcMs = Date.UTC(year!, month! - 1, day!, hour!, minute!, second!);

  for (let i = 0; i < 3; i++) {
    const asSantiago = readDateTimeParts(
      formatter.formatToParts(new Date(utcMs)),
    );
    const asUtcMs = Date.UTC(
      asSantiago.year,
      asSantiago.month - 1,
      asSantiago.day,
      asSantiago.hour,
      asSantiago.minute,
      asSantiago.second,
    );
    const desiredAsUtcMs = Date.UTC(
      year!,
      month! - 1,
      day!,
      hour!,
      minute!,
      second!,
    );
    const diff = desiredAsUtcMs - asUtcMs;
    utcMs += diff;
    if (diff === 0) {
      break;
    }
  }

  const result = new Date(utcMs);
  const roundTrip = readDateTimeParts(formatter.formatToParts(result));
  const formatted = `${roundTrip.year}-${pad2(roundTrip.month)}-${pad2(roundTrip.day)} ${pad2(roundTrip.hour)}:${pad2(roundTrip.minute)}:${pad2(roundTrip.second)}`;

  if (formatted !== expired) {
    throw new PaykuError("expired is not a valid date");
  }

  return result;
}

function validateExpiredField(
  expired: string | undefined,
  urlreturn: string | undefined,
  now: Date,
): void {
  // Solo `undefined` omite el campo; "" / whitespace son valores explícitos inválidos.
  if (expired === undefined) {
    return;
  }

  if (urlreturn === undefined || String(urlreturn).trim() === "") {
    throw new PaykuError("urlreturn is required when expired is set");
  }

  const expiredValue = String(expired).trim();

  if (!PAYKU_EXPIRED_FORMAT.test(expiredValue)) {
    throw new PaykuError("expired must use format YYYY-MM-DD HH:mm:ss");
  }

  let expiredAt: Date;
  try {
    expiredAt = parsePaykuExpiredInSantiago(expiredValue);
  } catch (error) {
    if (error instanceof PaykuError) {
      throw error;
    }
    throw new PaykuError("expired is not a valid date");
  }

  if (expiredAt.getTime() <= now.getTime() + PAYKU_EXPIRED_MIN_MARGIN_MS) {
    throw new PaykuError(
      "expired must be more than 5 minutes after the current time (America/Santiago)",
    );
  }
}

function validateClpPayerRutRequirement(
  payment: number | undefined,
  payerRut: string | undefined,
): void {
  if (payment === undefined) {
    return;
  }

  if (
    !(PAYKU_CLP_PAYMENTS_REQUIRING_PAYER_RUT as readonly number[]).includes(
      payment,
    )
  ) {
    return;
  }

  if (payerRut === undefined || String(payerRut).trim() === "") {
    throw new PaykuError(
      "additional_parameters.payer_rut is required for payment methods Etpay (4), Fintoc (19), and Floid (26)",
    );
  }
}

/**
 * Set de códigos CLP al validar `payment` en create.
 * - `catalog` (default): `PAYKU_PAYMENT_METHODS.CLP` (catálogo / cuenta)
 * - `create-docs`: solo `PAYKU_CLP_CREATE_PAYMENT_CODES`
 */
export type ClpPaymentCodeSet = "catalog" | "create-docs";

export type ValidateCreateTransactionOptions = {
  /** Override de reloj (tests). Por defecto `new Date()`. */
  now?: Date;
  /** Set de códigos CLP al validar `payment` en create. Por defecto `catalog`. */
  clpPaymentCodes?: ClpPaymentCodeSet;
};

function resolveClpPaymentCodes(
  set: ClpPaymentCodeSet = "catalog",
): readonly number[] {
  if (set === "create-docs") {
    return PAYKU_CLP_CREATE_PAYMENT_CODES;
  }

  return Object.values(PAYKU_PAYMENT_METHODS.CLP);
}

/**
 * Mapea `status` del payload `urlnotify` al status de `GET /transaction`.
 * Docs: notify usa `failed`; la API usa `rejected`.
 */
export function mapNotifyStatusToTransactionStatus(
  status: "success" | "failed" | string,
): PaykuTransactionStatus | string {
  if (status === "failed") {
    return "rejected";
  }

  return status;
}

/** Validación runtime de filtros `GET /api/transaction`. */
export function validateListTransactionsParams(
  params: PaykuListTransactionsParams,
): void {
  if (params.per_page === undefined) {
    return;
  }

  if (
    !Number.isFinite(params.per_page) ||
    params.per_page < 1 ||
    params.per_page > PAYKU_LIST_TRANSACTIONS_MAX_PER_PAGE
  ) {
    throw new PaykuError(
      `per_page must be between 1 and ${PAYKU_LIST_TRANSACTIONS_MAX_PER_PAGE}`,
    );
  }
}

export function validateCreateTransactionRequest(
  params: PaykuCreateTransactionRequest,
  options: ValidateCreateTransactionOptions = {},
): void {
  if (params.amount <= 0) {
    throw new PaykuError("amount must be greater than 0");
  }

  validateExpiredField(
    params.expired,
    params.urlreturn,
    options.now ?? new Date(),
  );

  if (params.payment !== undefined) {
    const validCodes: readonly number[] =
      params.currency === "CLP"
        ? resolveClpPaymentCodes(options.clpPaymentCodes)
        : Object.values(PAYKU_PAYMENT_METHODS[params.currency as PaykuCurrency]);

    if (!validCodes.includes(params.payment)) {
      throw new PaykuError(
        `payment ${params.payment} is not valid for currency ${params.currency}`,
      );
    }
  }

  if (params.currency === "CLP") {
    validateClpPayerRutRequirement(
      params.payment,
      params.additional_parameters?.payer_rut,
    );
  }

  const gateway = params.additional_parameters?.gateway;

  if (params.currency === "VES" && gateway !== undefined) {
    const validGateways = Object.values(PAYKU_VES_GATEWAYS);

    if (!validGateways.includes(gateway as (typeof validGateways)[number])) {
      throw new PaykuError(`Unknown VES gateway: ${gateway}`);
    }
  }
}

/** Validación runtime para `Payku.forCountry("CL").transactions.create`. */
export function validateChileCreateTransactionRequest(
  params: PaykuChileCreateTransactionRequest,
  options: ValidateCreateTransactionOptions = {},
): void {
  for (const field of [
    "email",
    "order",
    "subject",
    "urlreturn",
    "urlnotify",
  ] as const) {
    requireNonEmptyField(params[field], field);
  }

  validateCreateTransactionRequest(
    {
      ...params,
      currency: "CLP",
    },
    options,
  );
}

/** Construye pares `[clientId, percentage]` para `affiliation`. */
export function buildMarketplaceAffiliation(
  members: Array<{ clientId: string; percentage: string | number }>,
): PaykuMarketplaceAffiliationPair[] {
  return members.map((member) => [member.clientId, String(member.percentage)]);
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
  if (!Number.isFinite(merchant) || merchant < 0 || merchant > 100) {
    throw new PaykuError("merchant percentage must be a finite number between 0 and 100");
  }

  if (!Array.isArray(affiliation)) {
    throw new PaykuError("affiliation must be an array");
  }

  for (let i = 0; i < affiliation.length; i++) {
    const item = affiliation[i];
    if (!Array.isArray(item) || item.length !== 2) {
      throw new PaykuError(`affiliation[${i}] must be a tuple [clientId, percentage]`);
    }
    const [clientId, pct] = item;
    if (typeof clientId !== "string" || clientId.trim() === "") {
      throw new PaykuError(`affiliation[${i}].clientId must be a non-empty string`);
    }
    const numPct = Number(pct);
    if (!Number.isFinite(numPct) || numPct <= 0 || numPct > 100) {
      throw new PaykuError(`affiliation[${i}].percentage must be a finite number between 0 and 100`);
    }
  }

  const clients = affiliation.reduce((sum, [, pct]) => sum + Number(pct), 0);
  const total = merchant + clients;

  // Tolerancia documentada 0.01 + epsilon FP (p. ej. 20 + 79.99).
  const tolerance = 0.01 + Number.EPSILON * Math.max(1, Math.abs(total), 100);
  if (!Number.isFinite(total) || Math.abs(total - 100) > tolerance) {
    throw new PaykuError(
      `marketplace affiliation percentages must sum to 100 (got ${total})`,
    );
  }
}

export interface PaykuPaymentReturnResult {
  id?: string;
  status?: string;
  messageError?: string;
  expired: boolean;
}

/**
 * Parsea la query string o los parámetros devueltos por la pasarela en `urlreturn`
 * e identifica si la transacción expiró o registró error.
 */
export function parsePaymentReturnQuery(
  input:
    | string
    | URLSearchParams
    | Record<string, string | string[] | undefined>,
): PaykuPaymentReturnResult {
  let id: string | undefined;
  let status: string | undefined;
  let messageError: string | undefined;

  if (typeof input === "string") {
    let queryString = input;
    if (queryString.includes("#")) {
      queryString = queryString.slice(0, queryString.indexOf("#"));
    }
    if (queryString.includes("?")) {
      queryString = queryString.slice(queryString.indexOf("?") + 1);
    }
    const params = new URLSearchParams(queryString);
    id = params.get("id") ?? undefined;
    status = params.get("status") ?? undefined;
    messageError =
      params.get("message_error") ?? params.get("messageError") ?? undefined;
  } else if (input instanceof URLSearchParams) {
    id = input.get("id") ?? undefined;
    status = input.get("status") ?? undefined;
    messageError =
      input.get("message_error") ?? input.get("messageError") ?? undefined;
  } else if (typeof input === "object" && input !== null) {
    const getVal = (key: string): string | undefined => {
      const val = input[key];
      if (Array.isArray(val)) {
        return val[0];
      }
      return val;
    };
    id = getVal("id");
    status = getVal("status");
    messageError = getVal("message_error") ?? getVal("messageError");
  }

  const normalizedMessageError = messageError?.trim().toLowerCase();
  const normalizedStatus = status?.trim().toLowerCase();

  const isExpired =
    normalizedMessageError === "expired" || normalizedStatus === "expired";

  return {
    id,
    status,
    messageError,
    expired: isExpired,
  };
}

export function validateCreateMarketplaceClientRequest(
  params: PaykuCreateMarketplaceClientRequest,
): void {
  for (const field of ["email", "name", "phone"] as const) {
    requireNonEmptyField(params[field], field);
  }

  if (!params.bank) {
    throw new PaykuError("bank is required");
  }

  for (const field of ["sbif", "type", "num", "rut"] as const) {
    requireNonEmptyField(params.bank[field], `bank.${field}`);
  }
}

export function validateCreateMarketplaceAffiliationRequest(
  params: PaykuCreateMarketplaceAffiliationRequest,
): void {
  requireNonEmptyField(params.name, "name");
  requireNonEmptyField(params.percentage, "percentage");

  if (!Array.isArray(params.affiliation) || params.affiliation.length === 0) {
    throw new PaykuError("affiliation must be a non-empty array");
  }

  validateMarketplaceAffiliationPercentages(
    params.percentage,
    params.affiliation,
  );
}

export function validateMarketplaceTransactionRequest(
  params: PaykuMarketplaceTransactionRequest,
): void {
  for (const field of ["email", "order", "subject", "marketplace"] as const) {
    requireNonEmptyField(params[field], field);
  }

  if (params.amount === undefined || params.amount === null) {
    throw new PaykuError("amount is required");
  }

  const numAmount = Number(params.amount);
  if (!Number.isFinite(numAmount) || numAmount <= 0) {
    throw new PaykuError("amount must be greater than 0");
  }
}

export function validateCreateNullificationRequest(
  params: PaykuNullificationCreateRequest,
): void {
  requireStringField(params.id, "id", 40);
  requireStringField(params.subject, "subject", 200);

  if (params.amount === undefined || params.amount === null) {
    throw new PaykuError("amount is required");
  }

  if (typeof params.amount === "boolean") {
    throw new PaykuError("amount must be a number");
  }

  const numAmount = Number(params.amount);
  if (
    !Number.isFinite(numAmount) ||
    !Number.isInteger(numAmount) ||
    numAmount <= 0 ||
    numAmount > 99999999999999
  ) {
    throw new PaykuError("amount must be a positive integer of at most 14 digits");
  }
}

export function validateGetNullificationParams(id: string): void {
  requireNonEmptyField(id, "id");
}
export function validateCreateSubscriptionClientRequest(
  params: PaykuCreateSubscriptionClientRequest,
): void {
  for (const field of ["email", "name", "phone"] as const) {
    requireNonEmptyField(params[field], field);
  }
}

export function validateCreateSubscriptionRequest(
  params: PaykuCreateSubscriptionRequest,
): void {
  for (const field of ["plan", "client"] as const) {
    requireNonEmptyField(params[field], field);
  }

  if (params.amount !== undefined) {
    const numAmount = Number(params.amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      throw new PaykuError("amount must be greater than 0");
    }
  }
}

export function validateCreateSubscriptionTransactionRequest(
  params: PaykuCreateSubscriptionTransactionRequest,
): void {
  requireNonEmptyField(params.suscription, "suscription");

  if (params.amount !== undefined) {
    const numAmount = Number(params.amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      throw new PaykuError("amount must be greater than 0");
    }
  }
}

export function validateListSubscriptionClientsParams(
  params: PaykuListSubscriptionClientsParams,
): void {
  if (params.per_page === undefined) {
    return;
  }

  if (
    !Number.isInteger(params.per_page) ||
    params.per_page < 1 ||
    params.per_page > 100
  ) {
    throw new PaykuError("per_page must be between 1 and 100");
  }
}
