export type PaykuEnvironment = "sandbox" | "production";

export interface PaykuOptions {
  logging?: boolean;
}

/**
 * Cliente API de Payku.
 * Scaffold inicial — la integración completa se implementará en próximas versiones.
 */
export default class Payku {
  readonly publicToken: string;
  readonly privateToken: string;
  readonly environment: PaykuEnvironment;
  readonly options: PaykuOptions;

  constructor(
    publicToken: string,
    privateToken: string,
    environment: PaykuEnvironment = "sandbox",
    options: PaykuOptions = {},
  ) {
    if (!publicToken) {
      throw new Error("Payku: publicToken is required");
    }
    if (!privateToken) {
      throw new Error("Payku: privateToken is required");
    }

    this.publicToken = publicToken;
    this.privateToken = privateToken;
    this.environment = environment;
    this.options = options;
  }

  get baseUrl(): string {
    return this.environment === "production"
      ? "https://app.payku.cl/api"
      : "https://des.payku.cl/api";
  }
}
