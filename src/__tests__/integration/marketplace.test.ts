import { expect, test } from "bun:test";
import {
  createSandboxChileClient,
  describePaykuIntegration,
} from "../../test-utils/paykuIntegration";

describePaykuIntegration("integration / marketplace", () => {
  test("creates and deletes a maclient (cleanup)", async () => {
    const payku = createSandboxChileClient();
    const banks = await payku.banks.list({ currency: "clp" });
    const sbif = banks[0]?.code;
    expect(sbif).toBeTruthy();

    const suffix = Date.now().toString(36);
    const created = await payku.marketplace.clients.create({
      email: `sdk-smoke-${suffix}@example.com`,
      name: "SDK Smoke",
      phone: "912345678",
      bank: {
        sbif: String(sbif),
        type: "1",
        num: "12345678",
        rut: "11111111-1",
      },
    });

    try {
      expect(created.id).toBeTruthy();
      expect(created.status).toBeTruthy();
    } finally {
      if (created?.id) {
        const deleted = await payku.marketplace.clients.delete(created.id);
        expect(deleted.id).toBe(created.id);
      }
    }
  });
});
