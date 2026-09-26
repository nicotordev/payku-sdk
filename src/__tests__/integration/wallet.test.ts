import { expect, test } from "bun:test";
import { PAYKU_WALLET_SANDBOX_AMOUNTS } from "../../types/payku.wallet";
import {
  createSandboxChileClient,
  describePaykuIntegration,
  generateUniqueEmail,
  generateUniqueOrder,
  runCapabilityTest,
  SANDBOX_TEST_RUT,
  SANDBOX_TIMEOUT_MS,
} from "../../test-utils/paykuIntegration";

describePaykuIntegration("integration / wallet", () => {
  test(
    "reads wallet balance",
    async () => {
      const payku = createSandboxChileClient();
      const result = await runCapabilityTest("wallet.balance.get", () =>
        payku.wallet.balance.get(),
      );

      if (result.status === "executed") {
        expect(result.value).toBeDefined();
        expect(result.value.status).toBe("success");
      } else {
        expect(result.reason).toContain("skipped: capability unavailable");
      }
    },
    SANDBOX_TIMEOUT_MS,
  );

  test(
    "lists wallet movements",
    async () => {
      const payku = createSandboxChileClient();
      const result = await runCapabilityTest("wallet.movements.list", () =>
        payku.wallet.movements.list({ page: 1, per_page: 5 }),
      );

      if (result.status === "executed") {
        expect(result.value).toBeDefined();
        expect(Array.isArray(result.value.wallet_movements)).toBe(true);
      } else {
        expect(result.reason).toContain("skipped: capability unavailable");
      }
    },
    SANDBOX_TIMEOUT_MS,
  );

  test(
    "creates and retrieves a sandbox wallet payout using approved amount",
    async () => {
      const payku = createSandboxChileClient();
      const approvedAmount = PAYKU_WALLET_SANDBOX_AMOUNTS.APPROVED[0]; // 1000

      const payoutResult = await runCapabilityTest(
        "wallet.payouts.create",
        () =>
          payku.wallet.payouts.create({
            email: generateUniqueEmail("payout"),
            subject: "SDK Wallet Payout Smoke",
            currency: "CLP",
            order: generateUniqueOrder("payout"),
            amount: approvedAmount,
            accountbank_name: "Cuenta Prueba Sandbox",
            accountbank_rut: SANDBOX_TEST_RUT,
            accountbank_sbif: "0012", // Banco Estado
            accountbank_type: "1", // Cta Corriente
            accountbank_num: "12345678",
          }),
      );

      if (payoutResult.status === "skipped") {
        expect(payoutResult.reason).toContain(
          "skipped: capability unavailable",
        );
        return;
      }

      const payout = payoutResult.value;
      expect(payout.status).toBe("success");

      const payoutId = payout.identifier_payout || payout.identifier_wallet;
      expect(payoutId).toBeTruthy();

      // Consultar el payout creado
      const getResult = await runCapabilityTest("wallet.payouts.get", () =>
        payku.wallet.payouts.get(payoutId),
      );

      if (getResult.status === "executed") {
        expect(getResult.value.payout).toBeDefined();
        expect(getResult.value.payout.status).toBeTruthy();
      } else {
        expect(getResult.reason).toContain("skipped: capability unavailable");
      }
    },
    SANDBOX_TIMEOUT_MS,
  );
});
