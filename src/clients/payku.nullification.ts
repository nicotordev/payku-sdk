import {
  createPaykuAPIError,
  PaykuAPIError,
  PaykuNullificationError,
  type PaykuClientOptions,
} from "../errors";
import type { HttpClient } from "../http/client";
import {
  bodyAsRecord,
  validateCreateNullificationRequest,
  validateGetNullificationParams,
} from "../utils/payku.utils";
import type {
  PaykuCreateNullificationResponse,
  PaykuGetNullificationResponse,
  PaykuNullificationCallbackPayload,
  PaykuNullificationCreateRequest,
  PaykuVerifyNullificationCallbackOptions,
  PaykuVerifyNullificationCallbackResult,
} from "../types/payku.nullification";

export default class PaykuNullification {
  public create = this.createNullification.bind(this);
  public get = this.getNullification.bind(this);
  public verifyCallback = this.verifyNullificationCallback.bind(this);
  public verifyNotify = this.verifyNullificationCallback.bind(this);

  constructor(
    private readonly http: HttpClient,
    private readonly options?: PaykuClientOptions,
  ) {}

  private wrap<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    return fn().catch((error) => {
      throw createPaykuAPIError(
        error,
        operation,
        PaykuNullificationError,
        this.options,
      );
    });
  }

  private createNullification(
    params: PaykuNullificationCreateRequest,
  ): Promise<PaykuCreateNullificationResponse> {
    return this.wrap("nullification.create", async () => {
      validateCreateNullificationRequest(params);
      return this.http.request<PaykuCreateNullificationResponse>({
        method: "POST",
        path: "/nullification",
        body: bodyAsRecord(params),
        signed: true,
      });
    });
  }

  private getNullification(id: string): Promise<PaykuGetNullificationResponse> {
    return this.wrap("nullification.get", async () => {
      validateGetNullificationParams(id);
      return this.http.request<PaykuGetNullificationResponse>({
        method: "GET",
        path: `/nullification/${id}`,
        // Docs omit Sign on GET examples, but sandbox returns 401
        // `error:waiting sign` without it — keep signed.
        signed: true,
      });
    });
  }

  private async verifyNullificationCallback(
    payload: PaykuNullificationCallbackPayload,
    options: PaykuVerifyNullificationCallbackOptions = {},
  ): Promise<PaykuVerifyNullificationCallbackResult> {
    const rawId = payload?.id ? String(payload.id).trim() : "";
    const rawIdTx = payload?.id_transaction
      ? String(payload.id_transaction).trim()
      : "";

    if (!rawId && !rawIdTx) {
      return { valid: false, reason: "missing_id", callback: payload };
    }

    if (rawId && rawIdTx && rawId !== rawIdTx) {
      return { valid: false, reason: "id_mismatch", callback: payload };
    }

    const nullifyId = rawId || rawIdTx;

    const rawStatus = options.expectedStatus ?? payload?.status;
    if (
      rawStatus === undefined ||
      rawStatus === null ||
      String(rawStatus).trim() === ""
    ) {
      return { valid: false, reason: "missing_status", callback: payload };
    }
    const targetStatus = String(rawStatus).toLowerCase().trim();

    const rawAmount = options.expectedAmount ?? payload?.monto;
    if (
      rawAmount === undefined ||
      rawAmount === null ||
      !Number.isFinite(Number(rawAmount))
    ) {
      return { valid: false, reason: "missing_amount", callback: payload };
    }
    const expectedAmount = Number(rawAmount);

    try {
      const detailResponse = await this.get(nullifyId);
      const nullify = detailResponse.nullify;

      const queriedId = String(nullify?.id ?? "").trim();
      if (!queriedId || queriedId !== nullifyId) {
        return {
          valid: false,
          reason: "id_mismatch",
          callback: payload,
          nullify,
        };
      }

      const currentStatus = String(nullify.status_nullify ?? "")
        .toLowerCase()
        .trim();

      if (currentStatus !== targetStatus) {
        return {
          valid: false,
          reason: "status_mismatch",
          callback: payload,
          nullify,
        };
      }

      if (
        nullify.amount === undefined ||
        nullify.amount === null ||
        !Number.isFinite(Number(nullify.amount)) ||
        Number(nullify.amount) !== expectedAmount
      ) {
        return {
          valid: false,
          reason: "amount_mismatch",
          callback: payload,
          nullify,
        };
      }

      return { valid: true, nullify, callback: payload };
    } catch (error) {
      if (error instanceof PaykuAPIError) {
        return {
          valid: false,
          reason: "payku_api_error",
          callback: payload,
          error,
        };
      }

      throw error;
    }
  }
}
