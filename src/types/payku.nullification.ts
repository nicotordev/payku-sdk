/**
 * `POST /api/nullification` — crear anulación.
 * Docs: `id` (trx), `amount`, `subject` (no existe campo `transaction`).
 */
export interface PaykuNullificationCreateRequest {
  id: string;
  amount: number;
  subject: string;
}

export interface PaykuNullificationResponse {
  status?: string;
  id?: string;
  [key: string]: unknown;
}
