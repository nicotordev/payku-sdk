import { expect, test } from "bun:test";
import { PaykuError } from "../../errors";
import {
  createSandboxChileClient,
  describePaykuIntegration,
} from "../../test-utils/paykuIntegration";

describePaykuIntegration("integration / transactions", () => {
  test("lists transactions without throwing", async () => {
    const payku = createSandboxChileClient();
    const transactions = await payku.transactions.list({ page: 1 });

    expect(Array.isArray(transactions)).toBe(true);
  });

  test("creates a pending CLP transaction and fetches detail", async () => {
    const payku = createSandboxChileClient();
    const order = `smoke-${Date.now()}`;

    const created = await payku.transactions.create({
      email: "smoke-test@example.com",
      order,
      subject: "SDK smoke test",
      amount: 1000,
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
    const payku = createSandboxChileClient();

    await expect(
      payku.transactions.get("trx_does_not_exist_smoke"),
    ).rejects.toBeInstanceOf(PaykuError);
  });
});
