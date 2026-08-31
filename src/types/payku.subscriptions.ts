import type {
  PaykuRegisterResponse,
  PaykuSuccessResponse,
} from "./payku.responses";

export interface PaykuSubscriptionClientRequest {
  email: string;
  name?: string;
  phone?: string;
  address?: string;
  country?: string;
  region?: string;
  city?: string;
  postal_code?: string;
  additional_parameters?: Record<string, unknown>;
}

export interface PaykuSubscriptionClientResponse extends PaykuRegisterResponse {
  [key: string]: unknown;
}

export interface PaykuCreateSubscriptionRequest {
  plan: string;
  client: string;
  amount?: string;
  coupon?: string;
}

export interface PaykuCreateSubscriptionTransactionRequest {
  /** Wire format Payku: `suscription` (ortografía de la API). */
  suscription: string;
  amount?: string;
  order?: string;
  description?: string;
  /** Opcional en suscripción de consumo (`POST /api/sutransaction/`). */
  marketplace?: string;
  /** Opcional: tarjeta activa a cobrar (consumo). */
  card?: string;
}

/** Respuesta 200 de `POST /api/sutransaction`. */
export interface PaykuCreateSubscriptionTransactionResponse {
  status: string;
  order?: string;
  amount?: string;
  transaction_id?: string;
  verification_key?: string;
}

/**
 * `POST /api/suinscriptionscards` — afiliar/renovar tarjeta.
 * Payku espera el ID de suscripción en `suscription` (no `client`).
 */
export interface PaykuRegisterCardRequest {
  suscription: string;
}

/** Respuesta 200 de afiliar tarjeta (`status`, `id`, `url`). */
export interface PaykuRegisterCardResponse {
  status: string;
  id: string;
  url?: string;
}

/**
 * `POST /api/suscriptionsdeletecards` — eliminar tarjeta.
 * Docs: la tabla nombra el campo `suscription` pero ejemplos/CURL/JS y el error
 * sandbox (`type: "card"`) usan el wire key `card` (ID `sure…`).
 */
export interface PaykuDeleteCardRequest {
  card: string;
}

/** Respuesta 200 de eliminar tarjeta. */
export interface PaykuDeleteCardResponse {
  status: string;
  card: string;
}

export interface PaykuSubscriptionPlan {
  id?: string;
  name?: string;
  amount?: number | string;
  currency?: string;
  [key: string]: unknown;
}

export interface PaykuSubscriptionPlansResponse extends PaykuSuccessResponse {
  plans?: PaykuSubscriptionPlan[];
  [key: string]: unknown;
}

export interface PaykuSubscriptionsListResponse extends PaykuSuccessResponse {
  subscriptions?: Record<string, unknown>[];
  [key: string]: unknown;
}

export interface PaykuSubscriptionResponse {
  status?: string;
  id?: string;
  url?: string;
  [key: string]: unknown;
}
