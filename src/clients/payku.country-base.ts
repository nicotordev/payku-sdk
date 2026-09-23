import type { PaykuClientOptions } from "../errors";
import type { HttpClient } from "../http/client";
import { buildSign, type SignParams } from "../http/sign";
import type {
  PaykuCountry,
  PaykuCurrency,
  PaykuDefaultsConfig,
  PaykuEnvironment,
  PaykuFeature,
} from "../types/payku.common";
import { isFeatureSupported } from "../utils/payku.country";
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
  readonly defaults?: PaykuDefaultsConfig;
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
  readonly defaults?: PaykuDefaultsConfig;
  readonly baseUrl: string;
  readonly rootUrl: string;
}

/**
 * Base abstracta para vistas de clientes por país (Chile, Perú, Venezuela).
 * Centraliza la inicialización de credenciales, configuración y utilidades comunes.
 */
export abstract class PaykuCountryBase implements PaykuCountryClient {
  abstract readonly country: PaykuCountry;
  abstract readonly currency: PaykuCurrency;

  readonly publicToken: string;
  readonly privateToken: string;
  readonly environment: PaykuEnvironment;
  readonly options: PaykuClientOptions;
  readonly defaults?: PaykuDefaultsConfig;
  readonly webhooks: PaykuWebhooks;

  protected readonly core: PaykuCountryCore;

  /** Inicializa las propiedades compartidas por todos los clientes de país. */
  constructor(core: PaykuCountryCore) {
    this.core = core;
    this.publicToken = core.publicToken;
    this.privateToken = core.privateToken;
    this.environment = core.environment;
    this.options = core.options;
    this.defaults = core.defaults;
    this.webhooks = core.webhooks;
  }

  /** URL base de la API para el entorno configurado. */
  get baseUrl(): string {
    return this.core.baseUrl;
  }

  /** URL raíz de Payku para el entorno configurado. */
  get rootUrl(): string {
    return this.core.rootUrl;
  }

  /** HMAC-SHA256 del path y los parámetros, con el token privado de esta instancia. */
  sign = (apiPath: string, params: SignParams = {}): string =>
    buildSign(apiPath, params, this.privateToken);

  /** `true` si este país incluye el módulo. No lanza. */
  isSupported = (feature: PaykuFeature): boolean =>
    isFeatureSupported(this.country, feature);
}
