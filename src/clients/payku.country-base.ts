import type { PaykuClientOptions } from "../errors";
import type { HttpClient } from "../http/client";
import type {
  PaykuCountry,
  PaykuCurrency,
  PaykuEnvironment,
} from "../types/payku.common";
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
import type PaykuTransactions from "./payku.transactions";
import type PaykuWallet from "./payku.wallet";
import type PaykuWebhooks from "./payku.webhooks";

/** Dependencias internas compartidas por las vistas de país. */
export interface PaykuCountryCore {
  readonly publicToken: string;
  readonly privateToken: string;
  readonly environment: PaykuEnvironment;
  readonly options: PaykuClientOptions;
  readonly http: HttpClient;
  readonly transactions: PaykuTransactions;
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
  readonly baseUrl: string;
  readonly rootUrl: string;
}

export interface PaykuCountryClient {
  readonly country: PaykuCountry;
  readonly currency: PaykuCurrency;
  readonly publicToken: string;
  readonly privateToken: string;
  readonly environment: PaykuEnvironment;
  readonly options: PaykuClientOptions;
  readonly baseUrl: string;
  readonly rootUrl: string;
}
