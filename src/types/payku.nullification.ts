export interface PaykuNullificationCreateRequest {
  transaction?: string;
  amount?: number | string;
  [key: string]: unknown;
}

export interface PaykuNullificationResponse {
  status?: string;
  id?: string;
  [key: string]: unknown;
}
