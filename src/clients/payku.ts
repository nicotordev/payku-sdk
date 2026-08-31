import { PaykuAuthenticationError, type PaykuClientOptions } from "../errors";
import { HttpClient } from "../http/client";
import {
  getBaseUrl,
  getRootUrl,
  type PaykuCountry,
  type PaykuEnvironment,
} from "../types/payku.common";
import PaykuBanks from "./payku.banks";
import { PaykuChile } from "./payku.chile";
import PaykuConciliation from "./payku.conciliation";
import PaykuConsumptionSubscriptions from "./payku.consumption-subscriptions";
import type { PaykuCountryCore } from "./payku.country-base";
import PaykuEscrow from "./payku.escrow";
import PaykuEvents from "./payku.events";
import PaykuMall from "./payku.mall";
import PaykuMarketplace from "./payku.marketplace";
import PaykuNullification from "./payku.nullification";
import { PaykuPeru } from "./payku.peru";
import PaykuPaymentMethods from "./payku.payment-methods";
import PaykuSubscriptions from "./payku.subscriptions";
import PaykuTransactions from "./payku.transactions";
import { PaykuVenezuela } from "./payku.venezuela";
import PaykuWallet from "./payku.wallet";
import PaykuWebhooks from "./payku.webhooks";

export interface PaykuConfig {
  publicToken: string;
  privateToken: string;
  environment?: PaykuEnvironment;
  options?: PaykuClientOptions;
}

export type PaykuCountryClientMap = {
  CL: PaykuChile;
  PE: PaykuPeru;
  VE: PaykuVenezuela;
};

export type PaykuForCountryClient<C extends PaykuCountry> =
  PaykuCountryClientMap[C];

/**
 * Cliente API de Payku (modo global / multi-país).
 *
 * Para un comercio de un solo país preferí `Payku.forCountry("CL" | "PE" | "VE")`.
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

  private readonly http: HttpClient;

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

    this.http = new HttpClient({
      baseUrl: getBaseUrl(environment),
      rootUrl: getRootUrl(environment),
      publicToken,
      privateToken,
      logging: options.logging,
    });

    this.transactions = new PaykuTransactions(this.http, options);
    this.wallet = new PaykuWallet(this.http, options);
    this.banks = new PaykuBanks(this.http);
    this.paymentMethods = new PaykuPaymentMethods(this.http);
    this.subscriptions = new PaykuSubscriptions(this.http, options);
    this.consumptionSubscriptions = new PaykuConsumptionSubscriptions(
      this.http,
      options,
    );
    this.marketplace = new PaykuMarketplace(this.http, options);
    this.mall = new PaykuMall(this.http, options);
    this.events = new PaykuEvents(this.http, options);
    this.escrow = new PaykuEscrow(this.http, options);
    this.nullification = new PaykuNullification(this.http, options);
    this.conciliation = new PaykuConciliation(this.http, options);
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

  /**
   * Crea un cliente tipado por país: currency fija y solo módulos soportados.
   */
  static forCountry<C extends PaykuCountry>(
    country: C,
    config: PaykuConfig,
  ): PaykuForCountryClient<C> {
    const payku = Payku.fromConfig(config);
    const core = payku.toCountryCore();

    switch (country) {
      case "CL":
        return new PaykuChile(core) as PaykuForCountryClient<C>;
      case "PE":
        return new PaykuPeru(core) as PaykuForCountryClient<C>;
      case "VE":
        return new PaykuVenezuela(core) as PaykuForCountryClient<C>;
      default: {
        const exhaustive: never = country;
        throw new Error(`Unsupported Payku country: ${String(exhaustive)}`);
      }
    }
  }

  /**
   * Igual que `forCountry`, leyendo tokens desde variables de entorno.
   */
  static fromEnvForCountry<C extends PaykuCountry>(
    country: C,
    env: Record<string, string | undefined> = process.env,
  ): PaykuForCountryClient<C> {
    const publicToken = env.PAYKU_PUBLIC_TOKEN;
    const privateToken = env.PAYKU_PRIVATE_TOKEN;
    const environment = (env.PAYKU_ENVIRONMENT ??
      "sandbox") as PaykuEnvironment;

    if (!publicToken || !privateToken) {
      throw new PaykuAuthenticationError();
    }

    return Payku.forCountry(country, {
      publicToken,
      privateToken,
      environment,
    });
  }

  private toCountryCore(): PaykuCountryCore {
    return {
      publicToken: this.publicToken,
      privateToken: this.privateToken,
      environment: this.environment,
      options: this.options,
      http: this.http,
      transactions: this.transactions,
      wallet: this.wallet,
      banks: this.banks,
      paymentMethods: this.paymentMethods,
      webhooks: this.webhooks,
      subscriptions: this.subscriptions,
      consumptionSubscriptions: this.consumptionSubscriptions,
      marketplace: this.marketplace,
      mall: this.mall,
      events: this.events,
      escrow: this.escrow,
      nullification: this.nullification,
      conciliation: this.conciliation,
      baseUrl: this.baseUrl,
      rootUrl: this.rootUrl,
    };
  }

  get baseUrl(): string {
    return getBaseUrl(this.environment);
  }

  get rootUrl(): string {
    return getRootUrl(this.environment);
  }
}

export { PaykuChile } from "./payku.chile";
export { PaykuPeru } from "./payku.peru";
export { PaykuVenezuela } from "./payku.venezuela";
export { PaykuSharedWallet } from "./payku.wallet.scoped";
export {
  PaykuScopedTransactions,
  PaykuVenezuelaTransactions,
} from "./payku.transactions.scoped";
