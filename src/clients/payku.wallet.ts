import {
  PaykuAPIError,
  PaykuWalletError,
  wrapOperation,
  type PaykuClientOptions,
} from "../errors";
import type { HttpClient } from "../http/client";
import {
  bodyAsRecord,
  toQueryRecord,
  validateWalletPayoutRequest,
} from "../utils/payku.utils";
import type {
  PaykuCreateWalletPayoutResponse,
  PaykuCreateWalletWithdrawResponse,
  PaykuGetPayoutResponse,
  PaykuGetPayoutV3Response,
  PaykuPayoutNotifyPayload,
  PaykuVerifyPayoutNotifyOptions,
  PaykuVerifyPayoutNotifyResult,
  PaykuWalletBalanceResponse,
  PaykuWalletListParams,
  PaykuWalletListResponse,
  PaykuWalletPayoutRequest,
  PaykuWalletWithdrawRequest,
} from "../types/payku.wallet";

export default class PaykuWallet {
  public payouts = {
    create: this.createPayout.bind(this),
    get: this.getPayout.bind(this),
    getV3: this.getPayoutV3.bind(this),
    verifyNotify: this.verifyPayoutNotify.bind(this),
  };

  public balance = {
    get: this.getBalance.bind(this),
  };

  public movements = {
    list: this.listMovements.bind(this),
    get: this.getMovement.bind(this),
  };

  public withdraw = {
    create: this.createWithdraw.bind(this),
  };

  constructor(
    private readonly http: HttpClient,
    private readonly options?: PaykuClientOptions,
  ) {}

  /** Ejecuta una operación de wallet con errores tipados y logging común. */
  private wrap<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    return wrapOperation(operation, PaykuWalletError, this.options, fn);
  }

  /** Crea un payout de wallet después de validar sus datos. */
  private createPayout(
    params: PaykuWalletPayoutRequest,
  ): Promise<PaykuCreateWalletPayoutResponse> {
    return this.wrap("wallet.payouts.create", () => {
      validateWalletPayoutRequest(params);
      return this.http.request<PaykuCreateWalletPayoutResponse>({
        method: "POST",
        path: "/wallet/payout",
        body: bodyAsRecord(params),
        signed: true,
      });
    });
  }

  /** Crea un retiro firmado desde el saldo de wallet. */
  private createWithdraw(
    params: PaykuWalletWithdrawRequest,
  ): Promise<PaykuCreateWalletWithdrawResponse> {
    return this.wrap("wallet.withdraw.create", () =>
      this.http.request<PaykuCreateWalletWithdrawResponse>({
        method: "POST",
        path: "/wallet/withdraw",
        body: bodyAsRecord(params),
        signed: true,
      }),
    );
  }

  /** Obtiene el saldo actual de wallet. */
  private getBalance(): Promise<PaykuWalletBalanceResponse> {
    return this.wrap("wallet.balance.get", () =>
      this.http.request<PaykuWalletBalanceResponse>({
        method: "GET",
        path: "/wallet",
        signed: true,
      }),
    );
  }

  /** Lista los movimientos de wallet usando los filtros indicados. */
  private listMovements(
    params: PaykuWalletListParams = {},
  ): Promise<PaykuWalletListResponse> {
    return this.wrap("wallet.movements.list", () =>
      this.http.request<PaykuWalletListResponse>({
        method: "GET",
        path: "/wallet/list",
        query: toQueryRecord(params),
        signed: true,
      }),
    );
  }

  /** Obtiene el detalle de un movimiento de wallet. */
  private getMovement(id: string): Promise<PaykuWalletListResponse> {
    return this.wrap("wallet.movements.get", () =>
      this.http.request<PaykuWalletListResponse>({
        method: "GET",
        path: `/wallet/${id}`,
        signed: true,
      }),
    );
  }

  /** Obtiene un payout mediante el endpoint vigente. */
  private getPayout(id: string): Promise<PaykuGetPayoutResponse> {
    return this.wrap("wallet.payouts.get", () =>
      this.http.request<PaykuGetPayoutResponse>({
        method: "GET",
        path: `/payout/${id}`,
        signed: true,
      }),
    );
  }

  /** Obtiene un payout mediante el endpoint v3. */
  private getPayoutV3(id: string): Promise<PaykuGetPayoutV3Response> {
    return this.wrap("wallet.payouts.getV3", () =>
      this.http.request<PaykuGetPayoutV3Response>({
        method: "GET",
        path: `/payoutv3/${id}`,
        signed: true,
      }),
    );
  }

  private async verifyPayoutNotify(
    payload: PaykuPayoutNotifyPayload,
    options: PaykuVerifyPayoutNotifyOptions = {},
  ): Promise<PaykuVerifyPayoutNotifyResult> {
    const rawId = payload?.id ? String(payload.id).trim() : "";
    const rawIdentifierPayout = payload?.identifier_payout
      ? String(payload.identifier_payout).trim()
      : "";

    if (!rawId && !rawIdentifierPayout) {
      return { valid: false, reason: "missing_id", notify: payload };
    }

    if (rawId && rawIdentifierPayout && rawId !== rawIdentifierPayout) {
      return { valid: false, reason: "id_mismatch", notify: payload };
    }

    const payoutId = rawIdentifierPayout || rawId;

    const expectedStatus = options.expectedStatus ?? payload?.status;
    if (!expectedStatus || String(expectedStatus).trim() === "") {
      return { valid: false, reason: "missing_status", notify: payload };
    }

    try {
      const detailResponse = options.useV3
        ? await this.getPayoutV3(payoutId)
        : await this.getPayout(payoutId);

      const payout = detailResponse.payout;

      if (expectedStatus !== undefined && payout.status !== expectedStatus) {
        return {
          valid: false,
          reason: "status_mismatch",
          notify: payload,
          payout,
        };
      }

      if (
        options.expectedOrder !== undefined &&
        payload.order !== options.expectedOrder
      ) {
        return {
          valid: false,
          reason: "order_mismatch",
          notify: payload,
          payout,
        };
      }

      return { valid: true, payout, notify: payload };
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
