import {
  createPaykuAPIError,
  PaykuCreateTransactionError,
  PaykuError,
  PaykuGetTransactionError,
  PaykuListTransactionsError,
  type PaykuClientOptions,
} from "../errors";
import type { HttpClient } from "../http/client";
import type { PaykuDefaultsConfig } from "../types/payku.common";
import type {
  PaykuConfirmOnSiteRequest,
  PaykuConfirmOnSiteResponse,
  PaykuCreateTransactionRequest,
  PaykuCreateTransactionResponse,
  PaykuGetTransactionResponse,
  PaykuListTransactionsParams,
  PaykuListTransactionsResponse,
  PaykuReturnInput,
  PaykuReturnResult,
  PaykuTransaction,
} from "../types/payku.transactions";
import {
  bodyAsRecord,
  formatPaykuExpiredInSantiago,
  isNoRecordsErrorMessage,
  isTransactionFailed,
  isTransactionPaid,
  isTransactionPending,
  isTransactionSuccess,
  parsePaymentReturnQuery,
  resolveCreateTransactionPayment,
  resolveTransactionPayerRutParameters,
  toQueryRecord,
  validateCreateTransactionRequest,
  validateListTransactionsParams,
  type ValidateCreateTransactionOptions,
} from "../utils/payku.utils";

export default class PaykuTransactions {
  constructor(
    private readonly http: HttpClient,
    private readonly options?: PaykuClientOptions,
    private readonly defaults?: PaykuDefaultsConfig,
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

  /**
   * Procesa el retorno del cliente en `urlreturn` (desde URL, searchParams o query record).
   * Si la sesión expiró, retorna inmediatamente `isExpired: true`.
   * Si existe `id`, consulta el estado oficial de la transacción en la API y retorna
   * un objeto enriquecido con flags booleanos (`isPaid`, `isPending`, `isFailed`, `isExpired`).
   */
  public handleReturn = this.handleReturnPayment.bind(this);

  public static isPaid = isTransactionPaid;
  public static isSuccess = isTransactionSuccess;
  public static isPending = isTransactionPending;
  public static isFailed = isTransactionFailed;

  /**
   * Determina si una transacción, respuesta o payload está pagada exitosamente (`status: "success"`).
   */
  public isPaid = PaykuTransactions.isPaid;

  /**
   * Alias de `isPaid`: determina si una transacción fue exitosa (`status: "success"`).
   */
  public isSuccess = PaykuTransactions.isSuccess;

  /**
   * Determina si una transacción está pendiente de pago (`status: "pending"` o `"register"`).
   */
  public isPending = PaykuTransactions.isPending;

  /**
   * Determina si una transacción falló o fue rechazada (`status: "rejected"` o `"failed"`).
   */
  public isFailed = PaykuTransactions.isFailed;

  private async createTransaction(

    params: PaykuCreateTransactionRequest,
    options?: ValidateCreateTransactionOptions,
  ): Promise<PaykuCreateTransactionResponse> {
    const effectiveDefaults = options?.defaults ?? this.defaults;
    const now = options?.now ?? new Date();

    const resolvedExpired =
      params.expired !== undefined
        ? formatPaykuExpiredInSantiago(params.expired, now)
        : undefined;

    const additional_parameters = resolveTransactionPayerRutParameters(params);

    const mergedParams = resolveCreateTransactionPayment({
      ...params,
      expired: resolvedExpired,
      additional_parameters,
      urlreturn: params.urlreturn ?? effectiveDefaults?.urlreturn,
      urlnotify: params.urlnotify ?? effectiveDefaults?.urlnotify,
    });
    validateCreateTransactionRequest(mergedParams, {
      ...options,
      defaults: effectiveDefaults,
      now,
    });

    const { payerRut: _discard, ...bodyParams } = mergedParams;

    try {
      return await this.http.request<PaykuCreateTransactionResponse>({
        method: "POST",
        path: "/transaction",
        body: bodyAsRecord(bodyParams),
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
        path: `/transaction/${encodeURIComponent(id)}`,
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
    validateListTransactionsParams(params);

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

  private async handleReturnPayment(
    queryOrUrl: PaykuReturnInput,
  ): Promise<PaykuReturnResult> {
    const parsed = parsePaymentReturnQuery(queryOrUrl);

    if (parsed.expired) {
      return {
        id: parsed.id,
        isExpired: true,
        isPaid: false,
        isPending: false,
        isFailed: false,
        rawStatus: parsed.status ?? "expired",
      };
    }

    let transaction: PaykuGetTransactionResponse | undefined;
    if (parsed.id) {
      transaction = await this.get(parsed.id);
    }

    const normalizedStatus = (
      transaction?.status ?? parsed.status
    )?.trim().toLowerCase();

    const statusTarget = normalizedStatus;
    const isPaid =
      transaction !== undefined && isTransactionPaid(statusTarget);
    const isPending = isTransactionPending(statusTarget);
    const isFailed = isTransactionFailed(statusTarget);
    const isExpired = normalizedStatus === "expired" || parsed.expired;
    const rawStatus = transaction?.status ?? parsed.status;

    return {
      id: transaction?.id ?? parsed.id,
      isExpired,
      isPaid,
      isPending,
      isFailed,
      rawStatus,
      transaction,
    };
  }
}
