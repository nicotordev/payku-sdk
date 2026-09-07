import {
  createPaykuAPIError,
  PaykuAPIError,
  PaykuWalletError,
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

  private async createPayout(
    params: PaykuWalletPayoutRequest,
  ): Promise<PaykuCreateWalletPayoutResponse> {
    try {
      validateWalletPayoutRequest(params);
      return await this.http.request<PaykuCreateWalletPayoutResponse>({
        method: "POST",
        path: "/wallet/payout",
        body: bodyAsRecord(params),
        signed: true,
      });
    } catch (error) {
      throw createPaykuAPIError(
        error,
        "wallet.payouts.create",
        PaykuWalletError,
        this.options,
      );
    }
  }

  private async createWithdraw(
    params: PaykuWalletWithdrawRequest,
  ): Promise<PaykuCreateWalletWithdrawResponse> {
    try {
      return await this.http.request<PaykuCreateWalletWithdrawResponse>({
        method: "POST",
        path: "/wallet/withdraw",
        body: bodyAsRecord(params),
        signed: true,
      });
    } catch (error) {
      throw createPaykuAPIError(
        error,
        "wallet.withdraw.create",
        PaykuWalletError,
        this.options,
      );
    }
  }

  private async getBalance(): Promise<PaykuWalletBalanceResponse> {
    try {
      return await this.http.request<PaykuWalletBalanceResponse>({
        method: "GET",
        path: "/wallet",
        signed: true,
      });
    } catch (error) {
      throw createPaykuAPIError(
        error,
        "wallet.balance.get",
        PaykuWalletError,
        this.options,
      );
    }
  }

  private async listMovements(
    params: PaykuWalletListParams = {},
  ): Promise<PaykuWalletListResponse> {
    try {
      return await this.http.request<PaykuWalletListResponse>({
        method: "GET",
        path: "/wallet/list",
        query: toQueryRecord(params),
        signed: true,
      });
    } catch (error) {
      throw createPaykuAPIError(
        error,
        "wallet.movements.list",
        PaykuWalletError,
        this.options,
      );
    }
  }

  private async getMovement(id: string): Promise<PaykuWalletListResponse> {
    try {
      return await this.http.request<PaykuWalletListResponse>({
        method: "GET",
        path: `/wallet/${id}`,
        signed: true,
      });
    } catch (error) {
      throw createPaykuAPIError(
        error,
        "wallet.movements.get",
        PaykuWalletError,
        this.options,
      );
    }
  }

  private async getPayout(id: string): Promise<PaykuGetPayoutResponse> {
    try {
      return await this.http.request<PaykuGetPayoutResponse>({
        method: "GET",
        path: `/payout/${id}`,
        signed: true,
      });
    } catch (error) {
      throw createPaykuAPIError(
        error,
        "wallet.payouts.get",
        PaykuWalletError,
        this.options,
      );
    }
  }

  private async getPayoutV3(id: string): Promise<PaykuGetPayoutV3Response> {
    try {
      return await this.http.request<PaykuGetPayoutV3Response>({
        method: "GET",
        path: `/payoutv3/${id}`,
        signed: true,
      });
    } catch (error) {
      throw createPaykuAPIError(
        error,
        "wallet.payouts.getV3",
        PaykuWalletError,
        this.options,
      );
    }
  }

  private async verifyPayoutNotify(
    payload: PaykuPayoutNotifyPayload,
    options: PaykuVerifyPayoutNotifyOptions = {},
  ): Promise<PaykuVerifyPayoutNotifyResult> {
    const payoutId = payload?.identifier_payout || payload?.id;
    if (!payoutId) {
      return { valid: false, reason: "missing_id", notify: payload };
    }

    try {
      const detailResponse = options.useV3
        ? await this.getPayoutV3(payoutId)
        : await this.getPayout(payoutId);

      const payout = detailResponse.payout;
      const expectedStatus = options.expectedStatus ?? payload.status;

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

