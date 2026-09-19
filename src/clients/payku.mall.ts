import {
  createPaykuAPIError,
  PaykuAPIError,
  PaykuMallError,
  type PaykuClientOptions,
} from "../errors";
import type { HttpClient } from "../http/client";
import {
  bodyAsRecord,
  mapNotifyStatusToTransactionStatus,
  validateCreateMallTransactionRequest,
  validateGetMallTransactionParams,
} from "../utils/payku.utils";
import type {
  PaykuMallCreateResponse,
  PaykuMallGetResponse,
  PaykuMallNotifyPayload,
  PaykuMallTransactionRequest,
  PaykuVerifyMallNotifyOptions,
  PaykuVerifyMallNotifyResult,
} from "../types/payku.mall";

function nonEmptyString(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  const trimmed = String(value).trim();
  return trimmed === "" ? undefined : trimmed;
}

export default class PaykuMall {
  public create = this.createTransaction.bind(this);
  public get = this.getTransaction.bind(this);
  public verifyNotify = this.verifyMallNotify.bind(this);
  public verifyCallback = this.verifyMallNotify.bind(this);

  constructor(
    private readonly http: HttpClient,
    private readonly options?: PaykuClientOptions,
  ) {}

  private wrap<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    return fn().catch((error) => {
      throw createPaykuAPIError(
        error,
        operation,
        PaykuMallError,
        this.options,
      );
    });
  }

  private createTransaction(
    params: PaykuMallTransactionRequest,
  ): Promise<PaykuMallCreateResponse> {
    return this.wrap("mall.create", async () => {
      validateCreateMallTransactionRequest(params);
      return this.http.request<PaykuMallCreateResponse>({
        method: "POST",
        path: "/mall",
        body: bodyAsRecord(params),
        signed: true,
      });
    });
  }

  private getTransaction(id: string): Promise<PaykuMallGetResponse> {
    return this.wrap("mall.get", async () => {
      validateGetMallTransactionParams(id);
      return this.http.request<PaykuMallGetResponse>({
        method: "GET",
        path: `/mall/${id}`,
      });
    });
  }

  /**
   * Verifica un callback `urlnotify` de Mall consultando `GET /api/mall/{id}`.
   * No uses `webhooks.verifyNotify` (ese reconsulta `/transaction/{payment_key}`).
   *
   * Si no pasas `expectedStatus`, se deriva del `payload.status` mapeando
   * notify `failed` → API `rejected`.
   */
  private async verifyMallNotify(
    payload: PaykuMallNotifyPayload,
    options: PaykuVerifyMallNotifyOptions = {},
  ): Promise<PaykuVerifyMallNotifyResult> {
    const rawId = nonEmptyString(payload.id);
    const rawPaymentKey = nonEmptyString(payload.payment_key);

    if (!rawId && !rawPaymentKey) {
      return { valid: false, reason: "missing_id", notify: payload };
    }

    if (rawId && rawPaymentKey && rawId !== rawPaymentKey) {
      return { valid: false, reason: "id_mismatch", notify: payload };
    }

    const mallId = rawId ?? rawPaymentKey;
    if (!mallId) {
      return { valid: false, reason: "missing_id", notify: payload };
    }

    const rawStatus = options.expectedStatus ?? payload.status;
    if (nonEmptyString(rawStatus) === undefined) {
      return { valid: false, reason: "missing_status", notify: payload };
    }

    const expectedStatus = mapNotifyStatusToTransactionStatus(
      String(rawStatus).trim(),
    );

    try {
      const mall = await this.get(mallId);

      if (mall.status !== expectedStatus) {
        return {
          valid: false,
          reason: "status_mismatch",
          notify: payload,
          mall,
        };
      }

      const notifyKey = nonEmptyString(payload.verification_key);
      const apiKey = nonEmptyString(mall.payment?.verification_key);
      if (
        notifyKey !== undefined &&
        apiKey !== undefined &&
        notifyKey !== apiKey
      ) {
        return {
          valid: false,
          reason: "verification_key_mismatch",
          notify: payload,
          mall,
        };
      }

      const expectedAmount = options.expectedAmount ?? payload.amount;
      if (
        expectedAmount !== undefined &&
        expectedAmount !== null &&
        String(expectedAmount).trim() !== "" &&
        String(mall.amount) !== String(expectedAmount)
      ) {
        return {
          valid: false,
          reason: "amount_mismatch",
          notify: payload,
          mall,
        };
      }

      return { valid: true, mall, notify: payload };
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
