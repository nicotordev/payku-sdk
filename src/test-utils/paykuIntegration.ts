import { describe } from "bun:test";
import Payku from "../clients/payku";
import type { PaykuChile } from "../clients/payku.chile";

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
 * - `bunfig.toml` excluye la carpeta `src/__tests__/integration` del discovery de `bun test`
 * - `bun run test` / `test:unit` no incluyen esa carpeta
 * - `bun run test:integration` ejecuta `src/__tests__/integration`
 */
export const shouldRunIntegrationTests =
  paykuIntegrationConfig.environment === "sandbox" &&
  hasPaykuIntegrationCredentials;

export const describePaykuIntegration = shouldRunIntegrationTests
  ? describe
  : describe.skip;

/** Cliente Chile apuntando a sandbox (tokens de env). */
export function createSandboxChileClient(): PaykuChile {
  return Payku.forCountry("CL", {
    publicToken: paykuIntegrationConfig.publicToken,
    privateToken: paykuIntegrationConfig.privateToken,
    environment: paykuIntegrationConfig.environment as
      | "sandbox"
      | "production",
  });
}
