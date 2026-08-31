export interface PaykuEscrowAuthorizeRequest {
  transaction?: string;
  [key: string]: unknown;
}

export interface PaykuEscrowAuthorizeResponse {
  status?: string;
  [key: string]: unknown;
}
