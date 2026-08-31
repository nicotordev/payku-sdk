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

/** Response 200 de `POST /api/sususcription` (activación 3DS). */
export interface PaykuCreateSubscriptionResponse {
  status: string;
  id: string;
  url: string;
}

export interface PaykuSubscriptionDetailClient {
  id: string;
  name: string;
  email: string;
  rut?: string;
  phone?: string;
  /** Wire typo Payku con tilde. */
  "parámetros"?: unknown[];
  additional_parameters?: unknown;
}

export interface PaykuSubscriptionDetailPlan {
  id: string;
  name: string;
  currency: string;
}

export interface PaykuSubscriptionDetailCard {
  last_4_digits?: string;
  card_type?: string;
}

export interface PaykuSubscriptionDetailActiveCard {
  last_4_digits?: string;
  identifier?: string;
  card_type?: string;
  register?: string;
}

export interface PaykuSubscriptionDetailTransaction {
  created_at?: string;
  date_payment?: string;
  amount?: number;
  transaction?: number;
  authorization_code?: string;
  order?: string;
  description?: string;
  status?: string;
}

export interface PaykuSubscriptionStatusLog {
  change_date?: string | null;
  initial_status?: string | null;
  final_status?: string | null;
}

/** Response 200 de `GET /api/sususcription/{id}`. */
export interface PaykuGetSubscriptionResponse {
  id: string;
  status: string;
  start?: string;
  end?: string;
  client: PaykuSubscriptionDetailClient;
  plan: PaykuSubscriptionDetailPlan;
  cards?: PaykuSubscriptionDetailCard;
  active_cards?: PaykuSubscriptionDetailActiveCard[];
  transactions?: PaykuSubscriptionDetailTransaction[];
  logs?: { status?: PaykuSubscriptionStatusLog[] };
}

/** Ítem devuelto en `GET /api/sususcription` (incluye `last_status_current_payment`). */
export interface PaykuSubscriptionListItem extends PaykuGetSubscriptionResponse {
  last_status_current_payment?: string;
}

export interface PaykuListSubscriptionsQuery {
  page?: number;
  per_page?: number;
  date_init?: string;
  date_end?: string;
  active?: boolean | string;
  canceled?: boolean | string;
  suspended?: boolean | string;
  pending?: boolean | string;
  expired?: boolean | string;
  [key: string]: unknown;
}

/** Envelope de listado: `[{ subscriptions: [...] }]`. */
export type PaykuListSubscriptionsResponse = Array<{
  subscriptions: PaykuSubscriptionListItem[];
}>;

export interface PaykuListSubscriptionsV3Query {
  page?: number;
  per_page?: number;
  date_init?: string;
  date_end?: string;
  active?: boolean | string;
  canceled?: boolean | string;
  suspended?: boolean | string;
  pending?: boolean | string;
  expired?: boolean | string;
  [key: string]: unknown;
}

export interface PaykuSubscriptionV3PaidItem {
  payment_cycle_day?: string;
  payment_day?: string;
  status?: string;
  amount_paid?: number;
  try_number?: number;
  paid_number?: number;
  transactions?: unknown[];
}

/** Ítem v3: usa `estatus` (typo API) en lugar de `status` y omite `cards`. */
export interface PaykuSubscriptionV3Item
  extends Omit<PaykuGetSubscriptionResponse, "status" | "active_cards" | "cards"> {
  estatus: string;
  active_cards?: PaykuSubscriptionDetailCard;
  paid?: PaykuSubscriptionV3PaidItem[];
}

export type PaykuListSubscriptionsV3Response = Array<{
  subscriptions: PaykuSubscriptionV3Item[];
}>;

/** Response 200 de `DELETE /api/sususcription/{id}`. */
export interface PaykuDeleteSubscriptionResponse {
  id: string;
  status: string;
}

/** Cliente/Customer devuelto en `GET /api/suclient/customers`. */
export interface PaykuSubscriptionCustomer {
  last_4_digits?: string;
  identifier?: string;
  card_type?: string;
  register?: string;
  additional_parameters?: unknown;
  subcriptions?: Array<{
    id?: string;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

/** Response 200 de `GET /api/suclient/customers`. */
export type PaykuListSubscriptionClientsResponse = Array<{
  Customers: PaykuSubscriptionCustomer[];
}>;

/** @deprecated Prefer create/get/delete específicos. */
export type PaykuSubscriptionResponse =
  | PaykuCreateSubscriptionResponse
  | PaykuGetSubscriptionResponse
  | PaykuDeleteSubscriptionResponse;

/** @deprecated Prefer PaykuListSubscriptionsResponse / V3 / Clients. */
export type PaykuSubscriptionsListResponse =
  | PaykuListSubscriptionsResponse
  | PaykuListSubscriptionsV3Response
  | PaykuListSubscriptionClientsResponse
  | PaykuSuccessResponse;

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

/**
 * Alias explícito para `consumptionSubscriptions.transactions.create`
 * (`POST /api/sutransaction/`). Mismo wire que suscripción; docs de consumo
 * documentan `marketplace` y `card`.
 */
export type PaykuCreateConsumptionTransactionRequest =
  PaykuCreateSubscriptionTransactionRequest;

/** Respuesta 200 de `POST /api/sutransaction` / `sutransaction/`. */
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

/** Detalle de plan en get/list `suplan`. */
export interface PaykuSubscriptionPlan {
  id: string;
  status: string;
  name: string;
  code?: string;
  description?: string;
  url_notify_payment?: string;
  /** Wire typo Payku: `url_notify_suscription`. */
  url_notify_suscription?: string;
  total_suscription?: number;
  total_suscription_active?: number;
}

/** `GET /api/suplan/{id}` — `plans` es objeto. */
export interface PaykuGetSubscriptionPlanResponse {
  status: string;
  plans: PaykuSubscriptionPlan;
}

/** `GET /api/suplan/plans` — `plans` es array. */
export interface PaykuListSubscriptionPlansResponse {
  status: string;
  plans: PaykuSubscriptionPlan[];
}

/** @deprecated Prefer get/list específicos. */
export type PaykuSubscriptionPlansResponse =
  | PaykuGetSubscriptionPlanResponse
  | PaykuListSubscriptionPlansResponse;
