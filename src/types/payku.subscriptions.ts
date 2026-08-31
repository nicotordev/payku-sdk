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

export interface PaykuRegisterCardRequest {
  client: string;
  [key: string]: unknown;
}

export interface PaykuDeleteCardRequest {
  client: string;
  card?: string;
  [key: string]: unknown;
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
