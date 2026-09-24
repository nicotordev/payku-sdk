import { expect, test } from "bun:test";
import { PaykuConciliationError } from "../../errors";
import {
  createSandboxChileClient,
  describePaykuIntegration,
  runCapabilityTest,
  SANDBOX_TIMEOUT_MS,
} from "../../test-utils/paykuIntegration";

describePaykuIntegration("integration / conciliation", () => {
  test("queries conciliations for a valid range <= 30 days without future dates", async () => {
    const payku = createSandboxChileClient();

    // Rango válido de 7 días terminado ayer (sin fechas futuras)
    const endDate = new Date(Date.now() - 86_400_000);
    const startDate = new Date(endDate.getTime() - 7 * 86_400_000);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    const date_init = fmt(startDate);
    const date_end = fmt(endDate);

    const result = await runCapabilityTest("conciliation.list", async () => {
      try {
        return await payku.conciliation.list({ date_init, date_end });
      } catch (error) {
        // En sandbox, cuando no existen cierres bancarios en el período, Payku responde con "there are no records"
        if (
          error instanceof PaykuConciliationError &&
          error.message.includes("there are no records")
        ) {
          return { conciliation: [] };
        }
        throw error;
      }
    });

    if (result.status === "skipped") {
      expect(result.reason).toContain("skipped: capability unavailable");
      return;
    }

    const response = result.value;
    expect(Array.isArray(response.conciliation)).toBe(true);

    for (const item of response.conciliation) {
      if (item.id) {
        expect(typeof item.id).toBe("string");
      }
      if (item.status) {
        expect(typeof item.status).toBe("string");
      }
      if (Array.isArray(item.transaction)) {
        for (const tx of item.transaction) {
          if (tx.transaction_id) {
            expect(typeof tx.transaction_id).toBe("string");
          }
          if (tx.payment_key) {
            expect(typeof tx.payment_key).toBe("string");
          }
        }
      }
    }
  }, SANDBOX_TIMEOUT_MS);
});
