import type { PaykuClientOptions } from "../errors";
import type { PaykuEnvironment } from "../types/payku.common";
import type {
  PaykuCountryCore,
  PaykuCountryClient,
} from "./payku.country-base";
import type PaykuBanks from "./payku.banks";
import type PaykuConciliation from "./payku.conciliation";
import type PaykuConsumptionSubscriptions from "./payku.consumption-subscriptions";
import type PaykuEscrow from "./payku.escrow";
import type PaykuEvents from "./payku.events";
import type PaykuMall from "./payku.mall";
import type PaykuMarketplace from "./payku.marketplace";
import type PaykuNullification from "./payku.nullification";
import type PaykuPaymentMethods from "./payku.payment-methods";
import type PaykuSubscriptions from "./payku.subscriptions";
import type PaykuWallet from "./payku.wallet";
import type PaykuWebhooks from "./payku.webhooks";
import { PaykuChileTransactions } from "./payku.transactions.scoped";

/** Cliente tipado para comercios en Chile (CLP). */
export class PaykuChile implements PaykuCountryClient {
  readonly country = "CL" as const;
  readonly currency = "CLP" as const;

  readonly publicToken: string;
  readonly privateToken: string;
  readonly environment: PaykuEnvironment;
  readonly options: PaykuClientOptions;

  readonly transactions: PaykuChileTransactions;
  readonly wallet: PaykuWallet;
  readonly banks: PaykuBanks;
  readonly paymentMethods: PaykuPaymentMethods;
  readonly webhooks: PaykuWebhooks;
  readonly subscriptions: PaykuSubscriptions;
  readonly consumptionSubscriptions: PaykuConsumptionSubscriptions;
  readonly marketplace: PaykuMarketplace;
  readonly mall: PaykuMall;
  readonly events: PaykuEvents;
  readonly escrow: PaykuEscrow;
  readonly nullification: PaykuNullification;
  readonly conciliation: PaykuConciliation;

  private readonly core: PaykuCountryCore;

  constructor(core: PaykuCountryCore) {
    this.core = core;
    this.publicToken = core.publicToken;
    this.privateToken = core.privateToken;
    this.environment = core.environment;
    this.options = core.options;
    this.transactions = new PaykuChileTransactions(core.transactions);
    this.wallet = core.wallet;
    this.banks = core.banks;
    this.paymentMethods = core.paymentMethods;
    this.webhooks = core.webhooks;
    this.subscriptions = core.subscriptions;
    this.consumptionSubscriptions = core.consumptionSubscriptions;
    this.marketplace = core.marketplace;
    this.mall = core.mall;
    this.events = core.events;
    this.escrow = core.escrow;
    this.nullification = core.nullification;
    this.conciliation = core.conciliation;
  }

  get baseUrl(): string {
    return this.core.baseUrl;
  }

  get rootUrl(): string {
    return this.core.rootUrl;
  }
}
