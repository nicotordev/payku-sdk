import { expect, test } from "bun:test";
import {
  createSandboxChileClient,
  describePaykuIntegration,
} from "../../test-utils/paykuIntegration";

describePaykuIntegration("integration / wallet", () => {
  test("reads wallet balance", async () => {
    const payku = createSandboxChileClient();
    const balance = await payku.wallet.balance.get();

    expect(balance).toBeDefined();
  });
});
