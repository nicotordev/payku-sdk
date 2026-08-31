import type {
  PaykuGetTransactionResponse,
  PaykuNotifyPayload,
} from "./payku.transactions";

export type PaykuWebhookVerificationFailureReason =
  | "missing_token"
  | "missing_payment_key"
  | "status_mismatch"
  | "order_mismatch"
  | "amount_mismatch"
  | "payku_api_error";

export interface PaykuVerifyNotifyOptions {
  expectedStatus?: string;
  expectedOrder?: string;
  expectedAmount?: number | string;
}

export type PaykuVerifyNotifyResult =
  | {
      valid: true;
      transaction: PaykuGetTransactionResponse;
      notify: PaykuNotifyPayload;
    }
  | {
      valid: false;
      reason: PaykuWebhookVerificationFailureReason;
      notify?: PaykuNotifyPayload;
      transaction?: PaykuGetTransactionResponse;
      error?: unknown;
    };

export type { PaykuNotifyPayload, PaykuGetTransactionResponse };
