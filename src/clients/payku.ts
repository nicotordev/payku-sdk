import { PaykuAuthenticationError, type PaykuClientOptions } from "../errors";
import { HttpClient } from "../http/client";
import {
  getBaseUrl,
  getRootUrl,
  type PaykuEnvironment,
} from "../types/payku.common";
import PaykuBanks from "./payku.banks";
import PaykuConciliation from "./payku.conciliation";
import PaykuConsumptionSubscriptions from "./payku.consumption-subscriptions";
import PaykuEscrow from "./payku.escrow";
import PaykuEvents from "./payku.events";
import PaykuMall from "./payku.mall";
import PaykuMarketplace from "./payku.marketplace";
import PaykuNullification from "./payku.nullification";
import PaykuPaymentMethods from "./payku.payment-methods";
import PaykuSubscriptions from "./payku.subscriptions";
import PaykuTransactions from "./payku.transactions";
import PaykuWallet from "./payku.wallet";
import PaykuWebhooks from "./payku.webhooks";

export interface PaykuConfig {
  publicToken: string;
  privateToken: string;
  environment?: PaykuEnvironment;
  options?: PaykuClientOptions;
}

/**
 * Cliente API de Payku.
 */
export default class Payku {
  readonly publicToken: string;
  readonly privateToken: string;
  readonly environment: PaykuEnvironment;
  readonly options: PaykuClientOptions;

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

  constructor(
    publicToken: string,
    privateToken: string,
    environment: PaykuEnvironment = "sandbox",
    options: PaykuClientOptions = {},
  ) {
    if (!publicToken || !privateToken) {
      throw new PaykuAuthenticationError();
    }

    this.publicToken = publicToken;
    this.privateToken = privateToken;
    this.environment = environment;
    this.options = options;

    const http = new HttpClient({
      baseUrl: getBaseUrl(environment),
      rootUrl: getRootUrl(environment),
      publicToken,
      privateToken,
      logging: options.logging,
    });

    this.transactions = new PaykuTransactions(http, options);
    this.wallet = new PaykuWallet(http, options);
    this.banks = new PaykuBanks(http);
    this.paymentMethods = new PaykuPaymentMethods(http);
    this.subscriptions = new PaykuSubscriptions(http, options);
    this.consumptionSubscriptions = new PaykuConsumptionSubscriptions(
      http,
      options,
    );
    this.marketplace = new PaykuMarketplace(http, options);
    this.mall = new PaykuMall(http, options);
    this.events = new PaykuEvents(http, options);
    this.escrow = new PaykuEscrow(http, options);
    this.nullification = new PaykuNullification(http, options);
    this.conciliation = new PaykuConciliation(http, options);
    this.webhooks = new PaykuWebhooks(this.transactions);
  }

  static fromConfig(config: PaykuConfig): Payku {
    return new Payku(
      config.publicToken,
      config.privateToken,
      config.environment,
      config.options,
    );
  }

  static fromEnv(env: Record<string, string | undefined> = process.env): Payku {
    const publicToken = env.PAYKU_PUBLIC_TOKEN;
    const privateToken = env.PAYKU_PRIVATE_TOKEN;
    const environment = (env.PAYKU_ENVIRONMENT ??
      "sandbox") as PaykuEnvironment;

    if (!publicToken || !privateToken) {
      throw new PaykuAuthenticationError();
    }

    return new Payku(publicToken, privateToken, environment);
  }

  get baseUrl(): string {
    return getBaseUrl(this.environment);
  }

  get rootUrl(): string {
    return getRootUrl(this.environment);
  }
}
