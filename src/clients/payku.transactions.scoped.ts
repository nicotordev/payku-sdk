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
} from "../types/payku.common";
import { assertFeature } from "../utils/payku.country";
import { validateChileCreateTransactionRequest } from "../utils/payku.utils";
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
  ) {}

  create(
    params: PaykuScopedCreateTransactionRequest,
  ): Promise<PaykuCreateTransactionResponse> {
    return this.inner.create({
      ...params,
      currency: PAYKU_COUNTRY_CURRENCY[this.country],
    });
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
  constructor(private readonly transactions: PaykuTransactions) {
    super(transactions, "CL");
  }

  override async create(
    params: PaykuChileCreateTransactionRequest,
  ): Promise<PaykuCreateTransactionResponse> {
    validateChileCreateTransactionRequest(params);
    return this.transactions.create({
      ...params,
      currency: PAYKU_COUNTRY_CURRENCY.CL,
    });
  }
}

/**
 * Transacciones Venezuela: compartidas + confirmación On-Site.
 */
export class PaykuVenezuelaTransactions extends PaykuScopedTransactions {
  constructor(private readonly transactions: PaykuTransactions) {
    super(transactions, "VE");
  }

  confirmOnSite(
    params: PaykuConfirmOnSiteRequest,
  ): Promise<PaykuConfirmOnSiteResponse> {
    assertFeature("VE", "onSite");
    return this.transactions.confirmOnSite(params);
  }
}
