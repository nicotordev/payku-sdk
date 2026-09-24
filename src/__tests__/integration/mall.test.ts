import { expect, test } from "bun:test";
import { PaykuError } from "../../errors";
import {
  createSandboxChileClient,
  describePaykuIntegration,
  generateUniqueEmail,
  generateUniqueId,
  generateUniqueOrder,
  generateUniquePhone,
  runCapabilityTest,
  SANDBOX_TEST_RUT,
  SANDBOX_TIMEOUT_MS,
  withCleanup,
} from "../../test-utils/paykuIntegration";

describePaykuIntegration("integration / mall", () => {
  test("creates a mall transaction with valid affiliation and retrieves details", async () => {
    await withCleanup(async (tracker) => {
      const payku = createSandboxChileClient();
      const banks = await payku.banks.list({ currency: "clp" });
      const sbif = banks[0]?.code ?? "0016";

      // Para crear Mall, disponemos de una afiliación marketplace real
      const clientResult = await runCapabilityTest(
        "marketplace.clients.create",
        () =>
          payku.marketplace.clients.create({
            email: generateUniqueEmail("mall-client"),
            name: "Mall Smoke Client",
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
        console.info(
          `\n⚠️  [Payku Sandbox Capability] skipped: capability unavailable (mall.create: marketplace client required)\n`,
        );
        return;
      }

      const client = clientResult.value;
      tracker.register(async () => {
        await payku.marketplace.clients.delete(client.id);
      }, "delete mall maclient");

      const affResult = await runCapabilityTest(
        "marketplace.affiliations.create",
        () =>
          payku.marketplace.affiliations.create({
            name: "Mall Smoke Affiliation",
            percentage: 80,
            affiliation: [[client.id, 20]],
          }),
      );

      if (affResult.status === "skipped") {
        console.info(
          `\n⚠️  [Payku Sandbox Capability] skipped: capability unavailable (mall.create: marketplace affiliation required)\n`,
        );
        return;
      }

      const affiliation = affResult.value;
      tracker.register(async () => {
        await payku.marketplace.affiliations.delete(affiliation.id);
      }, "delete mall maaffiliation");

      const affiliationToken = affiliation.token || affiliation.id;

      // Crear transacción Mall
      const mallResult = await runCapabilityTest("mall.create", () =>
        payku.mall.create({
          email: generateUniqueEmail("mall-tx"),
          payment: 1,
          order: generateUniqueOrder("mall"),
          urlreturn: "https://example.com/return",
          urlnotify: "https://example.com/notify",
          merchant: [
            [
              affiliationToken,
              1000,
              "Mall Smoke Item",
              null,
              generateUniqueId("ind"),
            ],
          ],
        }),
      );

      if (mallResult.status === "skipped") {
        expect(mallResult.reason).toContain("skipped: capability unavailable");
        return;
      }

      const mall = mallResult.value;
      expect(mall.id).toBeTruthy();
      expect(mall.url).toMatch(/^https?:\/\//);

      // Consultar el mall creado con mall.get
      const detail = await payku.mall.get(mall.id);
      expect(detail.id).toBe(mall.id);
      expect(detail.status).toBeTruthy();
      expect(detail.amount).toBeDefined();
    });
  }, SANDBOX_TIMEOUT_MS);

  test("get missing id throws PaykuError", async () => {
    const payku = createSandboxChileClient();

    try {
      await payku.mall.get("mall_does_not_exist_smoke");
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(PaykuError);
      const err = error as PaykuError;
      expect(
        err.statusCode === 404 ||
          err.statusCode === 400 ||
          err.type === "Not Found" ||
          err.type === "Unprocessable Entity",
      ).toBe(true);
    }
  }, SANDBOX_TIMEOUT_MS);
});
