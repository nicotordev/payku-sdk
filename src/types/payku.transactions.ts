import type { PaykuCurrency } from "./payku.common";
import type {
  PaykuGatewayStatus,
  PaykuNullifyStatus,
  PaykuTransactionStatus,
} from "./payku.responses";

export interface PaykuTransactionAdditionalParameters {
  parameters1?: string;
  parameters2?: string;
  order_ext?: string;
  payer_rut?: string;
  payer_bank?: string;
  gateway?: string;
  [key: string]: unknown;
}

export interface PaykuCreateTransactionRequest {
  email?: string;
  order?: string;
  subject?: string;
  amount: number;
  currency: PaykuCurrency;
  payment?: number;
  expired?: string;
  urlreturn?: string;
  urlnotify?: string;
  additional_parameters?: PaykuTransactionAdditionalParameters;
}

/**
 * Create Chile (CLP) vía `Payku.forCountry("CL").transactions.create`.
 * Docs: `email`, `order`, `subject`, `urlreturn`, `urlnotify` requeridos; `payment` opcional (99 = todos).
 */
export interface PaykuChileCreateTransactionRequest {
  email: string;
  order: string;
  subject: string;
  amount: number;
  urlreturn: string;
  urlnotify: string;
  payment?: number;
  expired?: string;
  additional_parameters?: PaykuTransactionAdditionalParameters;
}

export interface PaykuOnSiteAccountService {
  bank_method?: string;
  bank_number?: string;
  bank_document?: string;
  bank_name?: string;
  bank_nameshort?: string;
  bank_code?: string;
  bank_linkqr?: string;
}

export interface PaykuOnSiteAttributesRequestPayer {
  phone_number?: string;
  payment_reference?: string;
  id_number?: string;
  bank_code?: string;
  payment_date?: string;
}

export interface PaykuOnSiteAttributesRequest {
  transaction?: string;
  payer?: PaykuOnSiteAttributesRequestPayer;
}

export interface PaykuCreateTransactionResponse {
  status: PaykuTransactionStatus;
  id: string;
  url: string;
  account_service?: PaykuOnSiteAccountService;
  attributes_request?: PaykuOnSiteAttributesRequest;
}

export interface PaykuConfirmOnSiteRequest {
  id: string;
  valid: string;
  transaction: string;
  payer: PaykuOnSiteAttributesRequestPayer & {
    phone_number: string;
    payment_reference: string;
    id_number: string;
    bank_code: string;
  };
}

export interface PaykuConfirmOnSiteResponse {
  transaction: string;
  status: string;
  message?: string;
  message_error?: string;
  gateway?: { status?: string };
}

export interface PaykuTransactionPaymentAdditionalParameters {
  identificador?: string;
  banco?: string;
  numero_cuenta?: string;
  network?: { ip_address?: string; [key: string]: unknown };
  [key: string]: unknown;
}

export interface PaykuTransactionPayment {
  start?: string;
  end?: string;
  media?: string;
  transaction_id?: number;
  payment_key?: string;
  transaction_key?: string | null;
  deposit_date?: string;
  verification_key?: string;
  authorization_code?: string;
  last_4_digits?: string;
  installments?: number;
  card_type?: string;
  additional_parameters?: PaykuTransactionPaymentAdditionalParameters;
  currency?: PaykuCurrency | string;
}

export interface PaykuTransactionNullify {
  status?: PaykuNullifyStatus | string;
}

export interface PaykuTransactionGatewayResponse {
  status?: PaykuGatewayStatus | string;
  message?: string;
}

export interface PaykuTransaction {
  id: string;
  status: PaykuTransactionStatus | string;
  created_at?: string;
  email?: string;
  amount?: number | string;
  order?: string;
  subject?: string;
  payment?: PaykuTransactionPayment;
  nullify?: PaykuTransactionNullify;
  gateway_response?: PaykuTransactionGatewayResponse;
}

export interface PaykuListTransactionsResponse {
  transaction: PaykuTransaction[];
}

export interface PaykuGetTransactionResponse {
  status: PaykuTransactionStatus | "success" | string;
  id: string;
  created_at?: string;
  order?: string;
  email?: string;
  subject?: string;
  amount?: number | string;
  payment?: PaykuTransactionPayment;
  nullify?: PaykuTransactionNullify;
  gateway_response?: PaykuTransactionGatewayResponse;
}

export interface PaykuListTransactionsParams {
  date_init?: string;
  date_end?: string;
  page?: number;
  per_page?: number;
  success?: boolean;
  pending?: boolean;
  rejected?: boolean;
}

export interface PaykuNotifyPayload {
  transaction_id: string;
  payment_key: string;
  transaction_key: string;
  verification_key: string;
  order: string;
  status: "success" | "failed";
}

/** @deprecated Use PaykuCreateTransactionRequest */
export type CreateTransactionParams = PaykuCreateTransactionRequest;
/** @deprecated Use PaykuCreateTransactionResponse */
export type CreateTransactionResponse = PaykuCreateTransactionResponse;
/** @deprecated Use PaykuTransaction */
export type Transaction = PaykuTransaction;
/** @deprecated Use PaykuGetTransactionResponse */
export type GetTransactionResponse = PaykuGetTransactionResponse;
/** @deprecated Use PaykuListTransactionsParams */
export type ListTransactionsParams = PaykuListTransactionsParams;
/** @deprecated Use PaykuListTransactionsResponse */
export type ListTransactionsResponse = PaykuListTransactionsResponse;
/** @deprecated Use PaykuNotifyPayload */
export type TransactionNotifyPayload = PaykuNotifyPayload;
