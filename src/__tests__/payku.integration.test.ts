import { expect, test } from "bun:test";
import Payku from "../clients/payku";
import {
  describePaykuIntegration,
  paykuIntegrationConfig,
} from "../test-utils/paykuIntegration";

describePaykuIntegration("Payku integration", () => {
  test("lists payment methods for configured account", async () => {
    const payku = new Payku(
      paykuIntegrationConfig.publicToken,
      paykuIntegrationConfig.privateToken,
      paykuIntegrationConfig.environment as "sandbox" | "production",
    );

    const methods = await payku.paymentMethods.list();
    expect(methods.length).toBeGreaterThan(0);
  });

  test("lists CLP banks", async () => {
    const payku = new Payku(
      paykuIntegrationConfig.publicToken,
      paykuIntegrationConfig.privateToken,
      paykuIntegrationConfig.environment as "sandbox" | "production",
    );

    const banks = await payku.banks.list({ currency: "clp" });
    expect(banks.length).toBeGreaterThan(0);
  });
});
