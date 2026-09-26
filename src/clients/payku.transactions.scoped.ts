import type {
  PaykuChileCreateTransactionRequest,
  PaykuConfirmOnSiteRequest,
  PaykuConfirmOnSiteResponse,
  PaykuCreateTransactionRequest,
  PaykuCreateTransactionResponse,
  PaykuGetTransactionResponse,
  PaykuListTransactionsParams,
  PaykuReturnInput,
  PaykuReturnResult,
  PaykuTransaction,
} from "../types/payku.transactions";
import {
  PAYKU_COUNTRY_CURRENCY,
  type PaykuCountry,
  type PaykuDefaultsConfig,
} from "../types/payku.common";
import { assertFeature } from "../utils/payku.country";
import {
  resolveTransactionPayerRutParameters,
  validateChileCreateTransactionRequest,
  type ValidateCreateTransactionOptions,
} from "../utils/payku.utils";
import PaykuTransactions from "./payku.transactions";

export type PaykuScopedCreateTransactionRequest = Omit<
  PaykuCreateTransactionRequest,
  "currency"
>;

/**
 * Transacciones con `currency` fija según el país del cliente.
 */
export class PaykuScopedTransactions {
  constructor(
    private readonly inner: PaykuTransactions,
    private readonly country: PaykuCountry,
    private readonly defaults?: PaykuDefaultsConfig,
  ) {}

  create(
    params: PaykuScopedCreateTransactionRequest,
    options?: ValidateCreateTransactionOptions,
  ): Promise<PaykuCreateTransactionResponse> {
    const effectiveOptions: ValidateCreateTransactionOptions = {
      ...options,
      defaults: options?.defaults ?? this.defaults,
    };
    return this.inner.create(
      {
        ...params,
        urlreturn: params.urlreturn ?? effectiveOptions.defaults?.urlreturn,
        urlnotify: params.urlnotify ?? effectiveOptions.defaults?.urlnotify,
        currency: PAYKU_COUNTRY_CURRENCY[this.country],
      },
      effectiveOptions,
    );
  }

  get(id: string): Promise<PaykuGetTransactionResponse> {
    return this.inner.get(id);
  }

  list(params: PaykuListTransactionsParams = {}): Promise<PaykuTransaction[]> {
    return this.inner.list(params);
  }

  listAll(
    params: PaykuListTransactionsParams = {},
  ): Promise<PaykuTransaction[]> {
    return this.inner.listAll(params);
  }

  iterate(
    params: PaykuListTransactionsParams = {},
  ): AsyncGenerator<PaykuTransaction> {
    return this.inner.iterate(params);
  }

  handleReturn(queryOrUrl: PaykuReturnInput): Promise<PaykuReturnResult> {
    return this.inner.handleReturn(queryOrUrl);
  }

  /**
   * Determina si una transacción, respuesta o payload está pagada exitosamente (`status: "success"`).
   */
  public static isPaid = PaykuTransactions.isPaid;

  /**
   * Determina si una transacción está pendiente de pago (`status: "pending"` o `"register"`).
   */
  public static isPending = PaykuTransactions.isPending;

  /**
   * Determina si una transacción falló o fue rechazada (`status: "rejected"` o `"failed"`).
   */
  public static isFailed = PaykuTransactions.isFailed;

  /**
   * Parsea la query string o los parámetros devueltos por la pasarela en `urlreturn`.
   */
  public static parseReturnQuery = PaykuTransactions.parseReturnQuery;

  /**
   * Alias de `PaykuTransactions.parseReturnQuery`.
   */
  public static parsePaymentReturnQuery =
    PaykuTransactions.parsePaymentReturnQuery;

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

  /**
   * Parsea la query string o los parámetros devueltos por la pasarela en `urlreturn`.
   */
  public parseReturnQuery = PaykuTransactions.parseReturnQuery;

  /**
   * Alias de `payku.transactions.parseReturnQuery`.
   */
  public parsePaymentReturnQuery = PaykuTransactions.parsePaymentReturnQuery;
}

/**
 * Transacciones Chile: create con campos requeridos de docs CLP.
 */
export class PaykuChileTransactions extends PaykuScopedTransactions {
  constructor(
    private readonly transactions: PaykuTransactions,
    private readonly defaultsConfig?: PaykuDefaultsConfig,
  ) {
    super(transactions, "CL", defaultsConfig);
  }

  override async create(
    params: PaykuChileCreateTransactionRequest,
    options?: ValidateCreateTransactionOptions,
  ): Promise<PaykuCreateTransactionResponse> {
    const effectiveOptions: ValidateCreateTransactionOptions = {
      ...options,
      defaults: options?.defaults ?? this.defaultsConfig,
    };
    validateChileCreateTransactionRequest(params, effectiveOptions);

    const additional_parameters = resolveTransactionPayerRutParameters(params);

    const { payerRut: _discard, ...restParams } = params;

    return this.transactions.create(
      {
        ...restParams,
        additional_parameters,
        urlreturn: params.urlreturn ?? effectiveOptions.defaults?.urlreturn,
        urlnotify: params.urlnotify ?? effectiveOptions.defaults?.urlnotify,
        currency: PAYKU_COUNTRY_CURRENCY.CL,
      },
      effectiveOptions,
    );
  }
}

/**
 * Transacciones Venezuela: compartidas + confirmación On-Site.
 */
export class PaykuVenezuelaTransactions extends PaykuScopedTransactions {
  constructor(
    private readonly transactions: PaykuTransactions,
    defaults?: PaykuDefaultsConfig,
  ) {
    super(transactions, "VE", defaults);
  }

  confirmOnSite(
    params: PaykuConfirmOnSiteRequest,
  ): Promise<PaykuConfirmOnSiteResponse> {
    assertFeature("VE", "onSite");
    return this.transactions.confirmOnSite(params);
  }
}
