/** Tupla wire de afiliado: `[email, percent]` (forma de los ejemplos CURL/JS). */
export type PaykuEventAffiliationTuple = [email: string, percent: number | string];

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

/** Interim response hasta tipar create vs get (#47). */
export interface PaykuEventResponse {
  status?: string;
  id?: string;
  event?: string;
  [key: string]: unknown;
}
