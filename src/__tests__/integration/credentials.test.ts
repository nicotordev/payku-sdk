import { expect, test } from "bun:test";
import {
  createSandboxChileClient,
  describePaykuIntegration,
  paykuIntegrationConfig,
} from "../../test-utils/paykuIntegration";

describePaykuIntegration("integration / credentials", () => {
  test("uses sandbox credentials from env", () => {
    expect(paykuIntegrationConfig.environment).toBe("sandbox");
    expect(paykuIntegrationConfig.publicToken.length).toBeGreaterThan(0);
    expect(paykuIntegrationConfig.privateToken.length).toBeGreaterThan(0);
  });

  test("builds Chile sandbox client", () => {
    const payku = createSandboxChileClient();
    expect(payku.transactions).toBeDefined();
    expect(payku.paymentMethods).toBeDefined();
  });
});
