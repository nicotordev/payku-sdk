import type { PaykuSuccessResponse } from "./payku.responses";

/**
 * `POST /api/suclient` — crear cliente.
 * Docs: `email`, `name`, `phone` requeridos; `rut` y dirección opcionales.
 */
export interface PaykuCreateSubscriptionClientRequest {
  email: string;
  name: string;
  phone: string;
  rut?: string;
  address?: string;
  country?: string;
  region?: string;
  city?: string;
  postal_code?: string;
  additional_parameters?: Record<string, unknown>;
}

/**
 * `PUT /api/suclient/{id}` — actualización parcial (todos opcionales).
 * Docs no incluyen `rut` en el body de update.
 */
export interface PaykuUpdateSubscriptionClientRequest {
  email?: string;
  name?: string;
  phone?: string;
  address?: string;
  country?: string;
  region?: string;
  city?: string;
  postal_code?: string;
  additional_parameters?: Record<string, unknown>;
}

/** @deprecated Preferir `PaykuCreateSubscriptionClientRequest`. */
export type PaykuSubscriptionClientRequest =
  PaykuCreateSubscriptionClientRequest;

/** Tarjeta activa en `GET /api/suclient/{id}` (`active_cards`). */
export interface PaykuSubscriptionClientActiveCard {
  last_4_digits?: string;
  identifier?: string;
  card_type?: string;
  register?: string;
}

export interface PaykuSubscriptionClientSubscriptionPlan {
  id?: string;
  name?: string;
  currency?: string;
}

export interface PaykuSubscriptionClientSubscriptionCard {
  last_4_digits?: string;
  card_type?: string;
}

export interface PaykuSubscriptionClientSubscriptionTransaction {
  created_at?: string;
  date_payment?: string;
  amount?: number;
  transaction?: number;
  authorization_code?: string;
  order?: string;
  description?: string;
  status?: string;
}

/**
 * Nested bajo wire key `subcriptions` (typo Payku, sin segunda “c”).
 * En create puede venir `null`. El nombre del tipo usa `Subscription`;
 * solo la propiedad JSON conserva el typo.
 */
export interface PaykuSubscriptionClientSubscription {
  id?: string;
  created_at?: string;
  status?: string;
  amount?: string;
  plan?: PaykuSubscriptionClientSubscriptionPlan[];
  cards?: PaykuSubscriptionClientSubscriptionCard[];
  transactions?: PaykuSubscriptionClientSubscriptionTransaction[];
}

/**
 * Respuesta 200 de create/get/update cliente.
 * Conserva typos de la API en propiedades JSON: `update_at`, `subcriptions`.
 */
export interface PaykuSubscriptionClientResponse {
  status?: string;
  id?: string;
  rut?: string;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  country?: string;
  region?: string;
  city?: string;
  postal_code?: string;
  created_at?: string;
  /** Wire typo Payku: `update_at` (no `updated_at`). */
  update_at?: string | null;
  /** Wire typo Payku: `subcriptions`. */
  subcriptions?: PaykuSubscriptionClientSubscription | null;
  active_cards?: PaykuSubscriptionClientActiveCard[];
  additional_parameters?: Record<string, unknown>;
}

/** Respuesta 200 de `DELETE /api/suclient/{id}`. */
export interface PaykuDeleteSubscriptionClientResponse {
  status: string;
  id: string;
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
