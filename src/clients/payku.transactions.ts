import {
  createPaykuAPIError,
  PaykuCreateTransactionError,
  PaykuError,
  PaykuGetTransactionError,
  PaykuListTransactionsError,
  type PaykuClientOptions,
} from "../errors";
import type { HttpClient } from "../http/client";
import type {
  PaykuConfirmOnSiteRequest,
  PaykuConfirmOnSiteResponse,
  PaykuCreateTransactionRequest,
  PaykuCreateTransactionResponse,
  PaykuGetTransactionResponse,
  PaykuListTransactionsParams,
  PaykuListTransactionsResponse,
  PaykuTransaction,
} from "../types/payku.transactions";
import {
  bodyAsRecord,
  isNoRecordsErrorMessage,
  toQueryRecord,
  validateCreateTransactionRequest,
} from "../utils/payku.utils";

export default class PaykuTransactions {
  constructor(
    private readonly http: HttpClient,
    private readonly options?: PaykuClientOptions,
  ) {}

  /**
   * Crea una orden de pago en Payku.
   */
  public create = this.createTransaction.bind(this);

  /**
   * Obtiene una transacción por id, payment_key o transaction_key.
   */
  public get = this.getTransaction.bind(this);

  /**
   * Lista transacciones con filtros documentados.
   */
  public list = this.listTransactions.bind(this);

  /**
   * Confirma un pago On-Site (Venezuela) en `/gateway/cobro`.
   */
  public confirmOnSite = this.confirmOnSitePayment.bind(this);

  private async createTransaction(
    params: PaykuCreateTransactionRequest,
  ): Promise<PaykuCreateTransactionResponse> {
    validateCreateTransactionRequest(params);

    try {
      return await this.http.request<PaykuCreateTransactionResponse>({
        method: "POST",
        path: "/transaction",
        body: bodyAsRecord(params),
      });
    } catch (error) {
      throw createPaykuAPIError(
        error,
        "transactions.create",
        PaykuCreateTransactionError,
        this.options,
      );
    }
  }

  private async getTransaction(
    id: string,
  ): Promise<PaykuGetTransactionResponse> {
    try {
      return await this.http.request<PaykuGetTransactionResponse>({
        method: "GET",
        path: `/transaction/${id}`,
      });
    } catch (error) {
      throw createPaykuAPIError(
        error,
        "transactions.get",
        PaykuGetTransactionError,
        this.options,
      );
    }
  }

  private async listTransactions(
    params: PaykuListTransactionsParams = {},
  ): Promise<PaykuTransaction[]> {
    try {
      const response = await this.http.request<PaykuListTransactionsResponse>({
        method: "GET",
        path: "/transaction",
        query: toQueryRecord(params),
      });

      return response.transaction ?? [];
    } catch (error) {
      if (
        error instanceof PaykuError &&
        isNoRecordsErrorMessage(error.message)
      ) {
        return [];
      }

      throw createPaykuAPIError(
        error,
        "transactions.list",
        PaykuListTransactionsError,
        this.options,
      );
    }
  }

  private async confirmOnSitePayment(
    params: PaykuConfirmOnSiteRequest,
  ): Promise<PaykuConfirmOnSiteResponse> {
    const { id, valid, transaction, payer } = params;

    try {
      return await this.http.requestRoot<PaykuConfirmOnSiteResponse>({
        method: "POST",
        path: "/gateway/cobro",
        query: { id, valid },
        body: { transaction, payer },
        signPath: "/gateway/cobro",
      });
    } catch (error) {
      throw createPaykuAPIError(
        error,
        "transactions.confirmOnSite",
        PaykuCreateTransactionError,
        this.options,
      );
    }
  }
}
