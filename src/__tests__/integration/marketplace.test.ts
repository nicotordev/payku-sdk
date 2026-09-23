import {
  createSandboxChileClient,
  describePaykuIntegration,
  generateUniqueEmail,
  generateUniquePhone,
  SANDBOX_TEST_RUT,
  SANDBOX_TIMEOUT_MS,
  withCleanup,
} from "../../test-utils/paykuIntegration";

describePaykuIntegration("integration / marketplace", () => {
  test("creates and deletes a maclient (cleanup)", async () => {
    await withCleanup(async (tracker) => {
      const payku = createSandboxChileClient();
      const banks = await payku.banks.list({ currency: "clp" });
      const sbif = banks[0]?.code;
      expect(sbif).toBeTruthy();

      const created = await payku.marketplace.clients.create({
        email: generateUniqueEmail("maclient"),
        name: "SDK Smoke",
        phone: generateUniquePhone(),
        bank: {
          sbif: String(sbif),
          type: "1",
          num: "12345678",
          rut: SANDBOX_TEST_RUT,
        },
      });

      if (created?.id) {
        tracker.register(async () => {
          const deleted = await payku.marketplace.clients.delete(created.id);
          expect(deleted.id).toBe(created.id);
        }, "delete maclient");
      }

      expect(created.id).toBeTruthy();
      expect(created.status).toBeTruthy();
    });
  }, SANDBOX_TIMEOUT_MS);
});
