import { expect, test } from "bun:test";
import {
  createSandboxChileClient,
  describePaykuIntegration,
  generateUniqueId,
  runCapabilityTest,
  SANDBOX_TIMEOUT_MS,
} from "../../test-utils/paykuIntegration";

describePaykuIntegration("integration / escrow", () => {
  test("authorizes settlement when escrow capability is available", async () => {
    const payku = createSandboxChileClient();
    const mockTxId = generateUniqueId("trx_escrow");

    const result = await runCapabilityTest("escrow.authorize", () =>
      payku.escrow.authorize({
        transactions: [mockTxId],
      }),
    );

    if (result.status === "skipped") {
      expect(result.reason).toContain("skipped: capability unavailable");
      return;
    }

    const response = result.value;
    expect(Array.isArray(response.transactions)).toBe(true);

    for (const item of response.transactions) {
      expect(item.transaction_id).toBeDefined();
      expect(item.status).toBeDefined();
      expect(typeof item.amount).toBe("number");
    }
  }, SANDBOX_TIMEOUT_MS);
});
