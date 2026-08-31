import { expect, test } from "bun:test";
import Payku from "../clients/payku";
import { PaykuError } from "../errors";
import {
  describePaykuIntegration,
  paykuIntegrationConfig,
} from "../test-utils/paykuIntegration";

function createSandboxClient() {
  return Payku.forCountry("CL", {
    publicToken: paykuIntegrationConfig.publicToken,
    privateToken: paykuIntegrationConfig.privateToken,
    environment: paykuIntegrationConfig.environment as
      | "sandbox"
      | "production",
  });
}

describePaykuIntegration("Payku sandbox smoke", () => {
  test("uses sandbox credentials from env", () => {
    expect(paykuIntegrationConfig.environment).toBe("sandbox");
    expect(paykuIntegrationConfig.publicToken.length).toBeGreaterThan(0);
    expect(paykuIntegrationConfig.privateToken.length).toBeGreaterThan(0);
  });

  test("lists payment methods for configured account", async () => {
    const payku = createSandboxClient();
    const methods = await payku.paymentMethods.list();

    expect(Array.isArray(methods)).toBe(true);
    expect(methods.length).toBeGreaterThan(0);
  });

  test("lists CLP banks", async () => {
    const payku = createSandboxClient();
    const banks = await payku.banks.list({ currency: "clp" });

    expect(Array.isArray(banks)).toBe(true);
    expect(banks.length).toBeGreaterThan(0);
    expect(banks[0]).toMatchObject({
      code: expect.any(String),
      name: expect.any(String),
    });
  });

  test("lists transactions without throwing", async () => {
    const payku = createSandboxClient();
    const transactions = await payku.transactions.list({ page: 1 });

    expect(Array.isArray(transactions)).toBe(true);
  });

  test("creates a pending CLP transaction", async () => {
    const payku = createSandboxClient();
    const order = `smoke-${Date.now()}`;

    const created = await payku.transactions.create({
      email: "smoke-test@example.com",
      order,
      subject: "SDK smoke test",
      amount: 1000,
      currency: "CLP",
      payment: 1,
      urlreturn: "https://example.com/return",
      urlnotify: "https://example.com/notify",
    });

    expect(created.id).toBeTruthy();
    expect(created.url).toMatch(/^https?:\/\//);
    expect(["pending", "register", "success"]).toContain(created.status);

    const detail = await payku.transactions.get(created.id);
    expect(detail.status).toBeTruthy();
    expect(detail.amount).toBeDefined();
    expect(detail.payment).toBeDefined();
  });

  test("throws PaykuError for missing transaction", async () => {
    const payku = createSandboxClient();

    await expect(
      payku.transactions.get("trx_does_not_exist_smoke"),
    ).rejects.toBeInstanceOf(PaykuError);
  });

  test("reads wallet balance", async () => {
    const payku = createSandboxClient();
    const balance = await payku.wallet.balance.get();

    expect(balance).toBeDefined();
  });
});
