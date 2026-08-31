/** Tupla wire de afiliado: `[email, percent]` (forma de los ejemplos CURL/JS). */
export type PaykuEventAffiliationTuple = [
  email: string,
  percent: number | string,
];

/**
 * `POST /api/event` — crear evento.
 * `event` es el indicador; no confundir con el nombre (`name`).
 */
export interface PaykuCreateEventRequest {
  event: string;
  name: string;
  date_event: string;
  date_closing_sales: string;
  date_payment: string;
  url_event?: string;
  url_logo?: string;
  service_sale?: number;
  /** Ejemplos docs: tuplas `[email, percent]`. */
  affiliation?: PaykuEventAffiliationTuple[];
}

export interface PaykuEventDistribution {
  affiliate: string;
  service_sale: string;
}

export interface PaykuEventAffiliate {
  id: string;
  email: string;
  percent: string;
  status: string;
}

/**
 * `POST /api/event` 200.
 * En response, `event` es el **nombre** del evento (no el indicador).
 */
export interface PaykuCreateEventResponse {
  status: string;
  id: string;
  event: string;
  date_event: string;
  date_payment: string;
  date_closing_sales: string;
  url_logo?: string;
  url_event?: string;
  distribution: PaykuEventDistribution;
  affiliation: PaykuEventAffiliate[];
}

/**
 * `GET /api/event/{id}` 200.
 * Usa `affiliations` (plural); sin `status` top-level en el ejemplo docs.
 */
export interface PaykuGetEventResponse {
  id: string;
  event: string;
  date_event: string;
  date_payment: string;
  date_closing_sales: string;
  url_logo?: string;
  url_event?: string;
  distribution: PaykuEventDistribution;
  affiliations: PaykuEventAffiliate[];
}

/** @deprecated Prefer PaykuCreateEventResponse / PaykuGetEventResponse */
export type PaykuEventResponse =
  | PaykuCreateEventResponse
  | PaykuGetEventResponse;
