import type {
  PaykuChileCreateTransactionRequest,
  PaykuConfirmOnSiteRequest,
  PaykuConfirmOnSiteResponse,
  PaykuCreateTransactionRequest,
  PaykuCreateTransactionResponse,
  PaykuGetTransactionResponse,
  PaykuListTransactionsParams,
  PaykuTransaction,
} from "../types/payku.transactions";
import {
  PAYKU_COUNTRY_CURRENCY,
  type PaykuCountry,
  type PaykuDefaultsConfig,
} from "../types/payku.common";
import { assertFeature } from "../utils/payku.country";
import {
  validateChileCreateTransactionRequest,
  type ValidateCreateTransactionOptions,
} from "../utils/payku.utils";
import type PaykuTransactions from "./payku.transactions";

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
    return this.transactions.create(
      {
        ...params,
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
