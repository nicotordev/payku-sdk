import { Buffer } from "node:buffer";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { URL } from "node:url";
import {
  PAYKU_COUNTRY_CURRENCY,
  type PaykuCountry,
  type PaykuCurrency,
  type PaykuDefaultsConfig,
} from "../types/payku.common";
import type { PaykuConciliationRequest } from "../types/payku.conciliation";
import type {
  PaykuCreateEventRequest,
  PaykuEventAffiliationTuple,
} from "../types/payku.events";
import type {
  PaykuMallMerchantTuple,
  PaykuMallTransactionRequest,
} from "../types/payku.mall";
import type {
  PaykuCreateMarketplaceAffiliationRequest,
  PaykuCreateMarketplaceClientRequest,
  PaykuMarketplaceAffiliationInput,
  PaykuMarketplaceAffiliationMemberInput,
  PaykuMarketplaceAffiliationPair,
  PaykuMarketplaceTransactionRequest,
} from "../types/payku.marketplace";
import type { PaykuEscrowAuthorizeRequest } from "../types/payku.escrow";
import type {
  PaykuChileCreateTransactionRequest,
  PaykuCreateTransactionRequest,
  PaykuCreateTransactionResponse,
  PaykuExpirationInput,
  PaykuListTransactionsParams,
  PaykuPaymentMethodInput,
  PaykuTransactionAdditionalParameters,
} from "../types/payku.transactions";
import type { PaykuNullificationCreateRequest } from "../types/payku.nullification";
import type { PaykuWalletPayoutRequest } from "../types/payku.wallet";
import type {
  PaykuBuildConsumptionGatewayUrlParams,
  PaykuCreateSubscriptionClientRequest,
  PaykuCreateSubscriptionRequest,
  PaykuCreateSubscriptionTransactionRequest,
  PaykuListSubscriptionClientsParams,
} from "../types/payku.subscriptions";
import {
  PAYKU_CLP_CREATE_PAYMENT_CODES,
  PAYKU_CLP_PAYMENTS_REQUIRING_PAYER_RUT,
  PAYKU_LIST_TRANSACTIONS_MAX_PER_PAGE,
  PAYKU_MALL_PAYMENT_CODES,
  PAYKU_PAYMENT_CODE_TO_SLUG,
  PAYKU_PAYMENT_METHODS,
  PAYKU_PAYMENT_SLUGS,
  PAYKU_VES_GATEWAYS,
} from "../constants/payku.constants";
import { PaykuError } from "../errors";
import type { PaykuTransactionStatus } from "../types/payku.responses";

export function buildPaymentRedirectUrl(
  response: Pick<PaykuCreateTransactionResponse, "url">,
): string {
  return response.url;
}

const CONSUMPTION_GATEWAY_PATH = "/suscripcion/index";
const CONSUMPTION_GATEWAY_RESERVED_KEYS = new Set([
  "idplan",
  "verif",
  "nombre",
  "apellido",
  "email",
  "telefono",
  "direct_full",
]);

function stripTrailingSlashes(value: string): string {
  let end = value.length;
  while (end > 0 && value[end - 1] === "/") {
    end -= 1;
  }
  return value.slice(0, end);
}

/**
 * URL de pasarela de consumo: `{rootUrl}/suscripcion/index?idplan&verif&nombre&apellido&email&telefono&direct_full`.
 * No llama a la API; el comercio redirige al cliente a Webpay.
 */
export function buildConsumptionGatewayUrl(
  params: PaykuBuildConsumptionGatewayUrlParams,
): string {
  requireNonEmptyField(params.rootUrl, "rootUrl");
  requireNonEmptyField(params.planId, "planId");
  requireStringField(params.verif, "verif");
  requireStringField(params.firstName, "firstName");
  requireStringField(params.lastName, "lastName");
  requireStringField(params.email, "email");
  requireNonEmptyField(params.phone, "phone");

  let url: URL;
  try {
    url = new URL(
      CONSUMPTION_GATEWAY_PATH,
      `${stripTrailingSlashes(String(params.rootUrl).trim())}/`,
    );
  } catch {
    throw new PaykuError("rootUrl is not a valid URL");
  }

  url.searchParams.set("idplan", String(params.planId).trim());
  url.searchParams.set("verif", params.verif.trim());
  url.searchParams.set("nombre", params.firstName.trim());
  url.searchParams.set("apellido", params.lastName.trim());
  url.searchParams.set("email", params.email.trim());
  url.searchParams.set("telefono", String(params.phone).trim());
  url.searchParams.set(
    "direct_full",
    params.directFull === false ? "false" : "true",
  );

  if (params.extra !== undefined) {
    for (const [key, value] of Object.entries(params.extra)) {
      const trimmedKey = key.trim();
      if (
        trimmedKey === "" ||
        CONSUMPTION_GATEWAY_RESERVED_KEYS.has(trimmedKey)
      ) {
        continue;
      }

      const serialized =
        typeof value === "boolean" ? String(value) : String(value).trim();
      if (serialized === "") {
        continue;
      }

      url.searchParams.set(trimmedKey, serialized);
    }
  }

  return url.toString();
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

/** Indica si un valor es un objeto record no nulo y no es un arreglo. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Convierte un valor presente a string sin espacios, u omite valores vacíos. */
export function nonEmptyString(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  const trimmed =
    typeof value === "string" ? value.trim() : String(value).trim();
  return trimmed === "" ? undefined : trimmed;
}

const verificationCompareKey = randomBytes(32);

/** Normaliza una clave de verificación a un digest de longitud fija. */
function hmacSha256(value: string): Buffer {
  return createHmac("sha256", verificationCompareKey)
    .update(value, "utf8")
    .digest();
}

/**
 * Compara dos claves de verificación de forma timing-safe evitando fugas
 * por longitud o contenido.
 */
export function verificationKeysEqual(left: string, right: string): boolean {
  return timingSafeEqual(hmacSha256(left), hmacSha256(right));
}

/**
 * Resuelve la moneda para clientes con scope de país ("clp", "pen", "ves").
 */
export function resolveScopedCurrency(
  country: PaykuCountry,
  overrideCurrency?: string,
): Lowercase<PaykuCurrency> {
  return (
    (overrideCurrency?.toLowerCase() as Lowercase<PaykuCurrency>) ??
    (PAYKU_COUNTRY_CURRENCY[country].toLowerCase() as Lowercase<PaykuCurrency>)
  );
}

/**
 * Extrae la query string de una URL o cadena, ignorando fragments (#) y prefijos (?).
 */
export function extractQueryString(input: string): string {
  let queryString = input;
  if (queryString.includes("#")) {
    queryString = queryString.slice(0, queryString.indexOf("#"));
  }
  if (queryString.includes("?")) {
    queryString = queryString.slice(queryString.indexOf("?") + 1);
  }
  return queryString;
}

/**
 * Convierte una URL, query string, URLSearchParams o Record de query en un Record plano de strings.
 */
export function parseQueryToRecord(
  input: unknown,
): Record<string, string | undefined> | undefined {
  if (typeof input === "string") {
    const params = new URLSearchParams(extractQueryString(input));
    const obj: Record<string, string> = {};
    params.forEach((value, key) => {
      if (!Object.hasOwn(obj, key)) {
        obj[key] = value;
      }
    });
    return obj;
  }

  if (
    typeof URLSearchParams !== "undefined" &&
    input instanceof URLSearchParams
  ) {
    const obj: Record<string, string> = {};
    input.forEach((value, key) => {
      if (!Object.hasOwn(obj, key)) {
        obj[key] = value;
      }
    });
    return obj;
  }

  if (typeof URL !== "undefined" && input instanceof URL) {
    const obj: Record<string, string> = {};
    input.searchParams.forEach((value, key) => {
      if (!Object.hasOwn(obj, key)) {
        obj[key] = value;
      }
    });
    return obj;
  }

  if (isRecord(input)) {
    const obj: Record<string, string | undefined> = {};
    for (const [key, val] of Object.entries(input)) {
      const candidate = Array.isArray(val) ? val[0] : val;
      obj[key] = typeof candidate === "string" ? candidate : undefined;
    }
    return obj;
  }

  return undefined;
}

/**
 * Valida si la suma de porcentajes de marketplace es 100 dentro de la tolerancia de punto flotante.
 */
export function isMarketplaceAffiliationTotal100(total: number): boolean {
  const tolerance = 0.01 + Number.EPSILON * Math.max(1, Math.abs(total), 100);
  return Number.isFinite(total) && Math.abs(total - 100) <= tolerance;
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

/** Docs Chile: `expired` wall-clock en hora Santiago. Soporta YYYY-MM-DD HH:mm y YYYY-MM-DD HH:mm:ss. */
const PAYKU_EXPIRED_FORMAT = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/;
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
    second: get("second") || 0,
  };
}

/**
 * Normaliza un RUT chileno:
 * - Limpia puntos y espacios en blanco
 * - Convierte el dígito verificador 'k' a mayúscula 'K'
 * - Asegura el guión antes del dígito verificador si es omitido en secuencias de solo dígitos (o K)
 */
export function normalizeRut(rut: string): string {
  if (typeof rut !== "string") {
    return rut;
  }
  const trimmed = rut.trim();
  if (trimmed === "") {
    return trimmed;
  }
  const cleaned = trimmed.replace(/[\s.]/g, "").toUpperCase();

  if (cleaned.includes("-")) {
    return cleaned;
  }

  if (/^\d+[0-9K]$/.test(cleaned)) {
    return `${cleaned.slice(0, -1)}-${cleaned.slice(-1)}`;
  }

  return cleaned;
}

export const normalizePaykuRut = normalizeRut;

/**
 * Resuelve y normaliza el payer_rut para transacciones a partir de params.payerRut o params.additional_parameters.payer_rut.
 */
export function resolveTransactionPayerRutParameters<
  T extends {
    payerRut?: string;
    additional_parameters?: PaykuTransactionAdditionalParameters;
  },
>(
  params: T,
): PaykuTransactionAdditionalParameters | undefined {
  const rawRut = params.payerRut ?? params.additional_parameters?.payer_rut;
  const normalizedRut =
    rawRut !== undefined && rawRut.trim() !== ""
      ? normalizeRut(rawRut)
      : rawRut;

  return normalizedRut !== undefined
    ? { ...params.additional_parameters, payer_rut: normalizedRut }
    : params.additional_parameters;
}

/**
 * Formatea un Date o duración relativa (`{ minutes }`, `{ hours }`, `{ days }`)
 * al formato estricto `"YYYY-MM-DD HH:mm"` en el huso horario legal de Santiago de Chile (`America/Santiago`).
 * Si el input es un string, lo retorna limpio (trim).
 */
export function formatPaykuExpiredInSantiago(
  input: PaykuExpirationInput,
  now: Date = new Date(),
): string {
  if (typeof input === "string") {
    return input.trim();
  }

  let targetDate: Date;

  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) {
      throw new PaykuError("expired is not a valid date");
    }
    targetDate = input;
  } else if (typeof input === "object" && input !== null) {
    const duration = input as {
      minutes?: number;
      hours?: number;
      days?: number;
    };
    const minutes = duration.minutes ?? 0;
    const hours = duration.hours ?? 0;
    const days = duration.days ?? 0;

    if (
      !Number.isFinite(minutes) ||
      !Number.isFinite(hours) ||
      !Number.isFinite(days) ||
      minutes < 0 ||
      hours < 0 ||
      days < 0 ||
      (minutes === 0 && hours === 0 && days === 0)
    ) {
      throw new PaykuError(
        "expired duration must contain positive numeric values",
      );
    }

    const totalMs =
      minutes * 60 * 1000 +
      hours * 60 * 60 * 1000 +
      days * 24 * 60 * 60 * 1000;
    targetDate = new Date(now.getTime() + totalMs);
  } else {
    throw new PaykuError(
      "expired must be a string, Date, or duration object",
    );
  }

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: PAYKU_SANTIAGO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(targetDate);
  const get = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((entry) => entry.type === type)?.value ?? "00";

  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
}

export const formatPaykuExpired = formatPaykuExpiredInSantiago;

/**
 * Interpreta `YYYY-MM-DD HH:mm:ss` o `YYYY-MM-DD HH:mm` como hora local America/Santiago.
 * Usa `Intl` (sin deps); el offset puede variar por DST histórico de Chile.
 */
export function parsePaykuExpiredInSantiago(expired: string): Date {
  const [datePart, timePart] = expired.split(" ");
  const [year, month, day] = datePart!.split("-").map(Number);
  const timeTokens = timePart!.split(":").map(Number);
  const hour = timeTokens[0];
  const minute = timeTokens[1];
  const second = timeTokens[2] ?? 0;

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
  let utcMs = Date.UTC(year!, month! - 1, day!, hour!, minute!, second);

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
      second,
    );
    const diff = desiredAsUtcMs - asUtcMs;
    utcMs += diff;
    if (diff === 0) {
      break;
    }
  }

  const result = new Date(utcMs);
  const roundTrip = readDateTimeParts(formatter.formatToParts(result));
  const formattedWithSec = `${roundTrip.year}-${pad2(roundTrip.month)}-${pad2(roundTrip.day)} ${pad2(roundTrip.hour)}:${pad2(roundTrip.minute)}:${pad2(roundTrip.second)}`;
  const formattedWithoutSec = `${roundTrip.year}-${pad2(roundTrip.month)}-${pad2(roundTrip.day)} ${pad2(roundTrip.hour)}:${pad2(roundTrip.minute)}`;

  if (formattedWithSec !== expired && formattedWithoutSec !== expired) {
    throw new PaykuError("expired is not a valid date");
  }

  return result;
}

function validateExpiredField(
  expired: PaykuExpirationInput | undefined,
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

  let expiredValue: string;
  try {
    expiredValue = formatPaykuExpiredInSantiago(expired, now);
  } catch (error) {
    if (error instanceof PaykuError) {
      throw error;
    }
    throw new PaykuError("expired is not a valid date");
  }

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
  /** URLs por defecto para `urlreturn` y `urlnotify`. */
  defaults?: PaykuDefaultsConfig;
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
 * Resuelve `payment` (código o slug) al código numérico de Payku para esa moneda.
 */
export function resolvePaymentMethod(
  payment: PaykuPaymentMethodInput | string,
  currency: PaykuCurrency,
): number {
  if (typeof payment === "number") {
    if (!Number.isInteger(payment)) {
      throw new PaykuError(
        `payment ${payment} is not valid for currency ${currency}`,
      );
    }
    return payment;
  }

  if (typeof payment !== "string" || payment.trim() === "") {
    throw new PaykuError("payment must be a number or a non-empty slug");
  }

  const slug = payment.trim().toLowerCase();
  const code = PAYKU_PAYMENT_SLUGS[currency][slug];
  if (code === undefined) {
    throw new PaykuError(
      `payment slug "${payment}" is not valid for currency ${currency}`,
    );
  }
  return code;
}

/** Código numérico → slug canónico (`1` → `"webpay"` en CLP). */
export function paymentMethodToSlug(
  code: number,
  currency: PaykuCurrency,
): string | undefined {
  return PAYKU_PAYMENT_CODE_TO_SLUG[currency][code];
}

/** Copia el request con `payment` resuelto a código numérico. */
export function resolveCreateTransactionPayment(
  params: PaykuCreateTransactionRequest,
): PaykuCreateTransactionRequest {
  if (params.payment === undefined) {
    return params;
  }

  return {
    ...params,
    payment: resolvePaymentMethod(params.payment, params.currency),
  };
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

  const payment =
    params.payment === undefined
      ? undefined
      : resolvePaymentMethod(params.payment, params.currency);

  if (payment !== undefined) {
    const validCodes: readonly number[] =
      params.currency === "CLP"
        ? resolveClpPaymentCodes(options.clpPaymentCodes)
        : Object.values(PAYKU_PAYMENT_METHODS[params.currency as PaykuCurrency]);

    if (!validCodes.includes(payment)) {
      throw new PaykuError(
        `payment ${payment} is not valid for currency ${params.currency}`,
      );
    }
  }

  if (params.currency === "CLP") {
    const payerRut =
      params.payerRut ?? params.additional_parameters?.payer_rut;
    validateClpPayerRutRequirement(
      payment,
      payerRut,
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
  const urlreturn = params.urlreturn ?? options.defaults?.urlreturn;
  const urlnotify = params.urlnotify ?? options.defaults?.urlnotify;

  for (const field of ["email", "order", "subject"] as const) {
    requireNonEmptyField(params[field], field);
  }
  requireNonEmptyField(urlreturn, "urlreturn");
  requireNonEmptyField(urlnotify, "urlnotify");

  const additional_parameters = resolveTransactionPayerRutParameters(params);

  validateCreateTransactionRequest(
    {
      ...params,
      urlreturn,
      urlnotify,
      currency: "CLP",
      additional_parameters,
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

function isMarketplaceAffiliationMember(
  item: PaykuMarketplaceAffiliationInput,
): item is PaykuMarketplaceAffiliationMemberInput {
  return !Array.isArray(item);
}

function toMarketplaceAffiliationPair(
  item: PaykuMarketplaceAffiliationInput,
  index: number,
): PaykuMarketplaceAffiliationPair {
  if (isMarketplaceAffiliationMember(item)) {
    if (typeof item.clientId !== "string") {
      throw new PaykuError(
        `affiliation[${index}].clientId must be a non-empty string`,
      );
    }
    return [item.clientId, String(item.percentage)];
  }

  if (item.length !== 2) {
    throw new PaykuError(
      `affiliation[${index}] must be a tuple [clientId, percentage]`,
    );
  }

  const clientId = item[0];
  if (typeof clientId !== "string") {
    throw new PaykuError(
      `affiliation[${index}].clientId must be a non-empty string`,
    );
  }
  return [clientId, String(item[1])];
}

/** Serializa objetos/tuplas de `affiliation` al wire `[[clientId, percentage], ...]`. */
export function normalizeMarketplaceAffiliation(
  affiliation: PaykuMarketplaceAffiliationInput[],
): PaykuMarketplaceAffiliationPair[] {
  if (!Array.isArray(affiliation)) {
    throw new PaykuError("affiliation must be an array");
  }
  return affiliation.map((item, index) =>
    toMarketplaceAffiliationPair(item, index),
  );
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

  if (!isMarketplaceAffiliationTotal100(total)) {
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
    | URL
    | URLSearchParams
    | Record<string, string | string[] | undefined | unknown>,
): PaykuPaymentReturnResult {
  const record = parseQueryToRecord(input);
  const id = record?.id;
  const status = record?.status;
  const messageError = record?.message_error ?? record?.messageError;

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

export function validateCreateEventRequest(
  params: PaykuCreateEventRequest,
): void {
  for (const field of [
    "event",
    "name",
    "date_event",
    "date_closing_sales",
    "date_payment",
  ] as const) {
    requireNonEmptyField(params[field], field);
  }

  if (params.affiliation !== undefined) {
    if (!Array.isArray(params.affiliation)) {
      throw new PaykuError("affiliation must be an array");
    }

    for (let i = 0; i < params.affiliation.length; i++) {
      const item = params.affiliation[i];
      if (!Array.isArray(item) || item.length !== 2) {
        throw new PaykuError(
          `affiliation[${i}] must be a 2-element tuple [email, percent]`,
        );
      }
      const [email, percent] = item;
      requireNonEmptyField(email, `affiliation[${i}].email`);
      const numPercent = Number(percent);
      if (!Number.isFinite(numPercent) || numPercent <= 0 || numPercent > 100) {
        throw new PaykuError(
          `affiliation[${i}].percent must be a finite number between 0 and 100`,
        );
      }
    }
  }
}

export function validateGetEventParams(id: string): void {
  requireNonEmptyField(id, "id");
}

export function validateCreateMallTransactionRequest(
  params: PaykuMallTransactionRequest,
): void {
  for (const field of ["email", "order", "urlreturn"] as const) {
    requireNonEmptyField(params[field], field);
  }

  if (params.payment === undefined || params.payment === null) {
    throw new PaykuError("payment is required");
  }

  const numPayment = Number(params.payment);
  if (
    !PAYKU_MALL_PAYMENT_CODES.includes(
      numPayment as (typeof PAYKU_MALL_PAYMENT_CODES)[number],
    )
  ) {
    throw new PaykuError(`payment code ${params.payment} is invalid for Mall`);
  }

  if (!Array.isArray(params.merchant) || params.merchant.length === 0) {
    throw new PaykuError("merchant must be a non-empty array");
  }

  for (let i = 0; i < params.merchant.length; i++) {
    const item = params.merchant[i];
    if (!Array.isArray(item) || item.length !== 5) {
      throw new PaykuError(`merchant[${i}] must be a valid merchant tuple of 5 elements`);
    }
    const [tokenOrAffiliationId, amount, subject, , individualOrder] = item;
    requireNonEmptyField(
      tokenOrAffiliationId,
      `merchant[${i}].tokenOrAffiliationId`,
    );
    requireNonEmptyField(subject, `merchant[${i}].subject`);
    requireNonEmptyField(individualOrder, `merchant[${i}].individualOrder`);

    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      throw new PaykuError(`merchant[${i}].amount must be greater than 0`);
    }
  }
}

export function validateGetMallTransactionParams(id: string): void {
  requireNonEmptyField(id, "id");
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
    normalizeMarketplaceAffiliation(params.affiliation),
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

export function validateEscrowAuthorizeRequest(
  params: PaykuEscrowAuthorizeRequest,
): void {
  if (
    !params ||
    !Array.isArray(params.transactions) ||
    params.transactions.length === 0
  ) {
    throw new PaykuError("transactions must be a non-empty array");
  }

  for (const trxId of params.transactions) {
    if (typeof trxId !== "string" || trxId.trim() === "") {
      throw new PaykuError("each transaction id must be a non-empty string");
    }
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

const PAYKU_DATE_ONLY_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

function parseValidDateOnly(value: unknown, field: string): Date {
  requireNonEmptyField(value, field);
  const trimmed = String(value).trim();
  if (!PAYKU_DATE_ONLY_FORMAT.test(trimmed)) {
    throw new PaykuError(`${field} must use format YYYY-MM-DD`);
  }

  const [year, month, day] = trimmed.split("-").map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day!));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month! - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new PaykuError(`${field} is not a valid date`);
  }

  return date;
}

export interface ValidateConciliationOptions {
  now?: Date;
}

/**
 * Valida parámetros de `POST /api/conciliation`:
 * - date_init y date_end requeridos en formato YYYY-MM-DD.
 * - Fechas válidas en calendario.
 * - No futuras respecto a hoy.
 * - date_init <= date_end.
 * - Rango máximo entre date_init y date_end <= 30 días.
 */
export function validateConciliationRequest(
  params: PaykuConciliationRequest,
  options: ValidateConciliationOptions = {},
): void {
  const initDate = parseValidDateOnly(params?.date_init, "date_init");
  const endDate = parseValidDateOnly(params?.date_end, "date_end");

  const now = options.now ?? new Date();
  const santiagoFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: PAYKU_SANTIAGO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = santiagoFormatter.formatToParts(now);
  const getPart = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((entry) => entry.type === type)?.value);
  const todayUtc = Date.UTC(
    getPart("year"),
    getPart("month") - 1,
    getPart("day"),
  );

  if (initDate.getTime() > todayUtc) {
    throw new PaykuError("date_init cannot be in the future");
  }

  if (endDate.getTime() > todayUtc) {
    throw new PaykuError("date_end cannot be in the future");
  }

  if (initDate.getTime() > endDate.getTime()) {
    throw new PaykuError("date_init must be less than or equal to date_end");
  }

  const diffMs = endDate.getTime() - initDate.getTime();
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays > 30) {
    throw new PaykuError("date range must not exceed 30 days");
  }
}

/**
 * Valida un request de pago a terceros (`POST /api/wallet/payout`).
 * Reglas de documentación de Payku:
 * - Para Banco Estado (SBIF `0012` o `12`), `accountbank_num` no debe exceder 12 dígitos,
 *   evitando que los usuarios ingresen el número de su tarjeta de débito (16 dígitos).
 */
export function validateWalletPayoutRequest(
  params: PaykuWalletPayoutRequest,
): void {
  if (!params) {
    throw new PaykuError("Payout request params are required");
  }

  const sbif = String(params.accountbank_sbif ?? "").trim();
  if (sbif === "0012" || sbif === "12") {
    const num = String(params.accountbank_num ?? "").trim();
    if (num.length > 12) {
      throw new PaykuError(
        "accountbank_num for Banco Estado (SBIF 0012) must not exceed 12 digits",
      );
    }
  }
}
