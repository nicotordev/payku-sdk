import { PaykuAPIError } from "../errors";
import type {
  PaykuNotifyPayload,
  PaykuVerifyNotifyOptions,
  PaykuVerifyNotifyResult,
  PaykuWebhookRequestInput,
  PaykuWebhookVerificationFailureReason,
} from "../types/payku.webhooks";
import {
  isRecord,
  mapNotifyStatusToTransactionStatus,
  nonEmptyString,
  verificationKeysEqual,
} from "../utils/payku.utils";
import type PaykuTransactions from "./payku.transactions";

export { isRecord };

type PaykuTransactionsClient = Pick<PaykuTransactions, "get">;

export default class PaykuWebhooks {
  public verifyNotify = this.verifyNotification.bind(this);
  public verifyCallback = this.verifyNotification.bind(this);
  public handleRequest = this.handleWebhookRequest.bind(this);

  constructor(private readonly transactions: PaykuTransactionsClient) {}

  /**
   * Verifica un callback de urlnotify consultando la transacción en Payku.
   *
   * Si no pasas `expectedStatus`, se deriva del `payload.status` mapeando
   * notify `failed` → API `rejected`.
   *
   * Si `payload.verification_key` y `transaction.payment.verification_key`
   * tienen valor, deben coincidir; si no, `reason` es `verification_key_mismatch`.
   */
  public async verifyNotification(
    payload: PaykuNotifyPayload,
    options: PaykuVerifyNotifyOptions = {},
  ): Promise<PaykuVerifyNotifyResult> {
    if (!payload.payment_key) {
      return { valid: false, reason: "missing_payment_key", notify: payload };
    }

    try {
      const transaction = await this.transactions.get(payload.payment_key);
      const expectedStatus = mapNotifyStatusToTransactionStatus(
        options.expectedStatus ?? payload.status,
      );

      if (transaction.status !== expectedStatus) {
        return {
          valid: false,
          reason: "status_mismatch",
          notify: payload,
          transaction,
        };
      }

      const notifyKey = nonEmptyString(payload.verification_key);
      const paymentVerificationKey = nonEmptyString(
        transaction.payment?.verification_key,
      );

      if (
        notifyKey !== undefined &&
        paymentVerificationKey !== undefined &&
        !verificationKeysEqual(notifyKey, paymentVerificationKey)
      ) {
        return {
          valid: false,
          reason: "verification_key_mismatch",
          notify: payload,
          transaction,
        };
      }

      if (
        options.expectedOrder !== undefined &&
        transaction.order !== options.expectedOrder &&
        payload.order !== options.expectedOrder
      ) {
        return {
          valid: false,
          reason: "order_mismatch",
          notify: payload,
          transaction,
        };
      }

      if (
        options.expectedAmount !== undefined &&
        String(transaction.amount) !== String(options.expectedAmount)
      ) {
        return {
          valid: false,
          reason: "amount_mismatch",
          notify: payload,
          transaction,
        };
      }

      return { valid: true, transaction, notify: payload };
    } catch (error) {
      if (error instanceof PaykuAPIError) {
        return {
          valid: false,
          reason: "payku_api_error",
          notify: payload,
          error,
        };
      }

      throw error;
    }
  }

  /**
   * Parsea un `Request` (Web API) o un payload ya leído y corre `verifyNotify`.
   */
  private async handleWebhookRequest(
    requestOrPayload: PaykuWebhookRequestInput,
    options: PaykuVerifyNotifyOptions = {},
  ): Promise<PaykuVerifyNotifyResult> {
    const parsed = await this.readNotifyPayload(requestOrPayload);
    if (!parsed.ok) {
      return {
        valid: false,
        reason:
          "reason" in parsed && typeof parsed.reason === "string"
            ? parsed.reason
            : "payku_api_error",
      };
    }

    return this.verifyNotification(parsed.payload, options);
  }

  /** Lee y valida estructuralmente un Request Web o payload ya parseado. */
  private async readNotifyPayload(
    input: PaykuWebhookRequestInput,
  ): Promise<
    | { ok: true; payload: PaykuNotifyPayload }
    | { ok: false; reason: PaykuWebhookVerificationFailureReason }
  > {
    if (
      typeof globalThis.Request !== "undefined" &&
      input instanceof globalThis.Request
    ) {
      let json: unknown;
      try {
        json = await input.json();
      } catch {
        return { ok: false, reason: "invalid_json" };
      }

      if (!isRecord(json)) {
        return { ok: false, reason: "invalid_payload" };
      }

      return { ok: true, payload: json as unknown as PaykuNotifyPayload };
    }

    if (!isRecord(input)) {
      return { ok: false, reason: "invalid_payload" };
    }

    return { ok: true, payload: input as PaykuNotifyPayload };
  }
}
