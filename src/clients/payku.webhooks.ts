import { PaykuAPIError } from "../errors";
import type {
  PaykuNotifyPayload,
  PaykuVerifyNotifyOptions,
  PaykuVerifyNotifyResult,
} from "../types/payku.webhooks";
import { mapNotifyStatusToTransactionStatus } from "../utils/payku.utils";
import type PaykuTransactions from "./payku.transactions";

type PaykuTransactionsClient = Pick<PaykuTransactions, "get">;

function nonEmptyVerificationKey(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

export default class PaykuWebhooks {
  public verifyNotify = this.verifyNotification.bind(this);
  public verifyCallback = this.verifyNotification.bind(this);

  constructor(private readonly transactions: PaykuTransactionsClient) {}

  /**
   * Verifica un callback de urlnotify consultando la transacción en Payku.
   *
   * Si no pasas `expectedStatus`, se deriva del `payload.status` mapeando
   * notify `failed` → API `rejected`.
   *
   * Si el payload y `transaction.payment.verification_key` tienen valor,
   * deben coincidir; si no, `reason` es `verification_key_mismatch`.
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

      const notifyKey = nonEmptyVerificationKey(payload.verification_key);
      const apiKey = nonEmptyVerificationKey(
        transaction.payment?.verification_key,
      );

      if (
        notifyKey !== undefined &&
        apiKey !== undefined &&
        notifyKey !== apiKey
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
}
