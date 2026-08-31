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
 *
 * Protecciones fuera de este helper:
 * - `bunfig.toml` excluye `**/payku.integration.test.ts` del discovery de `bun test`
 * - `bun run test` / `test:unit` descubren `src/__tests__` + `src/http` (sin integración)
 * - `bun run test:integration` es el comando explícito para ejecutarlo
 */
export const shouldRunIntegrationTests =
  paykuIntegrationConfig.environment === "sandbox" &&
  hasPaykuIntegrationCredentials;

export const describePaykuIntegration = shouldRunIntegrationTests
  ? describe
  : describe.skip;
