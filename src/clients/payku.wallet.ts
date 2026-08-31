import {
  createPaykuAPIError,
  PaykuWalletError,
  type PaykuClientOptions,
} from "../errors";
import type { HttpClient } from "../http/client";
import { bodyAsRecord, toQueryRecord } from "../utils/payku.utils";
import type {
  PaykuPayoutResponse,
  PaykuWalletBalanceResponse,
  PaykuWalletListParams,
  PaykuWalletListResponse,
  PaykuWalletPayoutCreateResponse,
  PaykuWalletPayoutRequest,
  PaykuWalletWithdrawCreateResponse,
  PaykuWalletWithdrawRequest,
} from "../types/payku.wallet";

export default class PaykuWallet {
  public payouts = {
    create: this.createPayout.bind(this),
    get: this.getPayout.bind(this),
    getV3: this.getPayoutV3.bind(this),
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
  ): Promise<PaykuWalletPayoutCreateResponse> {
    try {
      return await this.http.request<PaykuWalletPayoutCreateResponse>({
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
  ): Promise<PaykuWalletWithdrawCreateResponse> {
    try {
      return await this.http.request<PaykuWalletWithdrawCreateResponse>({
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

  private async getPayout(id: string): Promise<PaykuPayoutResponse> {
    try {
      return await this.http.request<PaykuPayoutResponse>({
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

  private async getPayoutV3(id: string): Promise<PaykuPayoutResponse> {
    try {
      return await this.http.request<PaykuPayoutResponse>({
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
}
