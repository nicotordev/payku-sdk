export interface PaykuConciliationRequest {
  date_init?: string;
  date_end?: string;
  [key: string]: unknown;
}

export interface PaykuConciliationResponse {
  status?: string;
  [key: string]: unknown;
}
