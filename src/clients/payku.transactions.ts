import { PAYKU_LIST_TRANSACTIONS_MAX_PER_PAGE } from "../constants/payku.constants";
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
  parsePaymentReturnQuery,
  resolveCreateTransactionPayment,
  resolveTransactionPayerRutParameters,
  toQueryRecord,
  validateCreateTransactionRequest,
  validateListTransactionsParams,
  type ValidateCreateTransactionOptions,
} from "../utils/payku.utils";

/** Día calendario `YYYY-MM-DD` en America/Santiago, el huso que usa Payku. */
function formatPaykuListDateInSantiago(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((entry) => entry.type === type)?.value ?? "00";

  return `${get("year")}-${get("month")}-${get("day")}`;
}

/**
 * Copia los filtros una vez. Payku usa la fecha actual si faltan `date_init` o
 * `date_end`; fijarlas aquí evita que un cambio de día, o una mutación del
 * objeto del llamador, altere las páginas siguientes.
 */
function snapshotListTransactionsParams(
  params: PaykuListTransactionsParams,
): PaykuListTransactionsParams {
  const today = formatPaykuListDateInSantiago(new Date());

  return {
    ...params,
    date_init: params.date_init ?? today,
    date_end: params.date_end ?? today,
  };
}

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
   * Acumula todas las transacciones del filtro, página a página, hasta agotar resultados.
   * Si omites `per_page`, cada request usa `PAYKU_LIST_TRANSACTIONS_MAX_PER_PAGE`.
   * `date_init` y `date_end` omitidos se fijan al día actual en America/Santiago
   * antes de la primera página y se reutilizan en el resto.
   */
  public listAll = this.listAllTransactions.bind(this);

  /**
   * Generador asíncrono. Pide la página siguiente al consumir los ítems de la actual.
   * Misma paginación, límite de `per_page` y fijación de fechas que `listAll`.
   */
  public iterate = this.iterateTransactions.bind(this);

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

  /**
   * Determina si una transacción, respuesta o payload está pagada exitosamente (`status: "success"`).
   */
  public static isPaid = isTransactionPaid;

  /**
   * Determina si una transacción está pendiente de pago (`status: "pending"` o `"register"`).
   */
  public static isPending = isTransactionPending;

  /**
   * Determina si una transacción falló o fue rechazada (`status: "rejected"` o `"failed"`).
   */
  public static isFailed = isTransactionFailed;

  /**
   * Determina si una transacción, respuesta o payload está pagada exitosamente (`status: "success"`).
   */
  public isPaid = PaykuTransactions.isPaid;

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

  private async listAllTransactions(
    params: PaykuListTransactionsParams = {},
  ): Promise<PaykuTransaction[]> {
    const transactions: PaykuTransaction[] = [];

    for await (const transaction of this.iterateTransactions(params)) {
      transactions.push(transaction);
    }

    return transactions;
  }

  private async *iterateTransactions(
    params: PaykuListTransactionsParams = {},
  ): AsyncGenerator<PaykuTransaction> {
    const fixedParams = snapshotListTransactionsParams(params);
    const perPage =
      fixedParams.per_page ?? PAYKU_LIST_TRANSACTIONS_MAX_PER_PAGE;
    let page = fixedParams.page ?? 1;

    while (true) {
      const batch = await this.listTransactions({
        ...fixedParams,
        page,
        per_page: perPage,
      });

      for (const transaction of batch) {
        yield transaction;
      }

      if (batch.length < perPage) {
        return;
      }

      page += 1;
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

    const normalizedStatus = (transaction?.status ?? parsed.status)
      ?.trim()
      .toLowerCase();

    const statusTarget = normalizedStatus;
    const isPaid = transaction !== undefined && isTransactionPaid(statusTarget);
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
