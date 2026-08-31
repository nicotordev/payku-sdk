import type { PaykuClientOptions } from "../errors";
import type { PaykuEnvironment } from "../types/payku.common";
import type {
  PaykuCountryCore,
  PaykuCountryClient,
} from "./payku.country-base";
import type PaykuBanks from "./payku.banks";
import type PaykuPaymentMethods from "./payku.payment-methods";
import type PaykuWebhooks from "./payku.webhooks";
import { PaykuScopedTransactions } from "./payku.transactions.scoped";
import { PaykuSharedWallet } from "./payku.wallet.scoped";

/** Cliente tipado para comercios en Perú (PEN). */
export class PaykuPeru implements PaykuCountryClient {
  readonly country = "PE" as const;
  readonly currency = "PEN" as const;

  readonly publicToken: string;
  readonly privateToken: string;
  readonly environment: PaykuEnvironment;
  readonly options: PaykuClientOptions;

  readonly transactions: PaykuScopedTransactions;
  readonly wallet: PaykuSharedWallet;
  readonly banks: PaykuBanks;
  readonly paymentMethods: PaykuPaymentMethods;
  readonly webhooks: PaykuWebhooks;

  private readonly core: PaykuCountryCore;

  constructor(core: PaykuCountryCore) {
    this.core = core;
    this.publicToken = core.publicToken;
    this.privateToken = core.privateToken;
    this.environment = core.environment;
    this.options = core.options;
    this.transactions = new PaykuScopedTransactions(core.transactions, "PE");
    this.wallet = new PaykuSharedWallet(core.wallet, "PE");
    this.banks = core.banks;
    this.paymentMethods = core.paymentMethods;
    this.webhooks = core.webhooks;
  }

  get baseUrl(): string {
    return this.core.baseUrl;
  }

  get rootUrl(): string {
    return this.core.rootUrl;
  }
}
