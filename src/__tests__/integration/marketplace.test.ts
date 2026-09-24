import { expect, test } from "bun:test";
import {
  createSandboxChileClient,
  describePaykuIntegration,
  generateUniqueEmail,
  generateUniquePhone,
  runCapabilityTest,
  SANDBOX_TEST_RUT,
  SANDBOX_TIMEOUT_MS,
  withCleanup,
} from "../../test-utils/paykuIntegration";

describePaykuIntegration("integration / marketplace", () => {
  test("creates, fetches, updates maclient and manages affiliation", async () => {
    await withCleanup(async (tracker) => {
      const payku = createSandboxChileClient();
      const banks = await payku.banks.list({ currency: "clp" });
      const sbif = banks[0]?.code;
      expect(sbif).toBeTruthy();

      const clientResult = await runCapabilityTest(
        "marketplace.clients.create",
        () =>
          payku.marketplace.clients.create({
            email: generateUniqueEmail("maclient"),
            name: "SDK Smoke Client",
            phone: generateUniquePhone(),
            bank: {
              sbif: String(sbif),
              type: "1",
              num: "12345678",
              rut: SANDBOX_TEST_RUT,
            },
          }),
      );

      if (clientResult.status === "skipped") {
        expect(clientResult.reason).toContain("skipped: capability unavailable");
        return;
      }

      const client = clientResult.value;
      expect(client.id).toBeTruthy();
      expect(client.name).toBe("SDK Smoke Client");
      expect(client.bank).toBeDefined();

      tracker.register(async () => {
        const deleted = await payku.marketplace.clients.delete(client.id);
        expect(deleted.id).toBe(client.id);
      }, "delete maclient");

      // Consultar cliente creado (clients.get)
      const fetchedClient = await payku.marketplace.clients.get(client.id);
      expect(fetchedClient.id).toBe(client.id);
      expect(fetchedClient.email).toBe(client.email);

      // Validar actualización firmada de cliente (clients.update)
      const updateResult = await runCapabilityTest(
        "marketplace.clients.update",
        () =>
          payku.marketplace.clients.update(client.id, {
            name: "Updated Smoke Client",
            phone: generateUniquePhone(),
          }),
      );

      if (updateResult.status === "executed") {
        expect(updateResult.value.id).toBe(client.id);
        expect(updateResult.value.name).toBe("Updated Smoke Client");
      } else {
        expect(updateResult.reason).toContain("skipped: capability unavailable");
      }

      // Crear afiliación (affiliations.create)
      const affResult = await runCapabilityTest(
        "marketplace.affiliations.create",
        () =>
          payku.marketplace.affiliations.create({
            name: "Smoke Affiliation",
            percentage: 80,
            affiliation: [[client.id, 20]],
          }),
      );

      if (affResult.status === "executed") {
        const affiliation = affResult.value;
        expect(affiliation.id).toBeTruthy();
        expect(affiliation.token || affiliation.id).toBeTruthy();

        tracker.register(async () => {
          const deletedAff = await payku.marketplace.affiliations.delete(
            affiliation.id,
          );
          expect(deletedAff.id).toBe(affiliation.id);
        }, "delete maaffiliation");

        // Consultar afiliación creada (affiliations.get)
        const fetchedAff = await payku.marketplace.affiliations.get(
          affiliation.id,
        );
        expect(fetchedAff.id).toBe(affiliation.id);
        expect(fetchedAff.name).toBe("Smoke Affiliation");
      } else {
        expect(affResult.reason).toContain("skipped: capability unavailable");
      }
    });
  }, SANDBOX_TIMEOUT_MS);
});
