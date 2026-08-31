import { describe } from "bun:test";

const PLACEHOLDER_VALUES = new Set([
  "",
  "your_public_token",
  "your_private_token",
]);

const hasRealCredential = (value: string | undefined): boolean =>
  value !== undefined && value !== "" && !PLACEHOLDER_VALUES.has(value);

export const paykuIntegrationConfig = {
  publicToken: process.env.PAYKU_PUBLIC_TOKEN ?? "",
  privateToken: process.env.PAYKU_PRIVATE_TOKEN ?? "",
  environment: process.env.PAYKU_ENVIRONMENT ?? "sandbox",
};

export const hasPaykuIntegrationCredentials =
  hasRealCredential(paykuIntegrationConfig.publicToken) &&
  hasRealCredential(paykuIntegrationConfig.privateToken);

/**
 * Corre solo con tokens reales y `PAYKU_ENVIRONMENT=sandbox`.
 * El opt-in es el comando `bun run test:integration` (no una env flag extra).
 */
export const shouldRunIntegrationTests =
  paykuIntegrationConfig.environment === "sandbox" &&
  hasPaykuIntegrationCredentials;

export const describePaykuIntegration = shouldRunIntegrationTests
  ? describe
  : describe.skip;
