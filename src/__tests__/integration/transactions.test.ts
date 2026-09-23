import { expect, test } from "bun:test";
import { PaykuAPIError } from "../../errors";
import {
  createSandboxChileClient,
  describePaykuIntegration,
  generateUniqueEmail,
  generateUniqueOrder,
  noteCapabilityDependent,
  SANDBOX_TIMEOUT_MS,
  santiagoDateOnly,
} from "../../test-utils/paykuIntegration";

const INITIAL_STATUSES = ["pending", "register", "success"] as const;

describePaykuIntegration("integration / transactions", () => {
  test("lists transactions without throwing", async () => {
    const payku = createSandboxChileClient();
    const transactions = await payku.transactions.list({ page: 1 });

    expect(Array.isArray(transactions)).toBe(true);
  }, SANDBOX_TIMEOUT_MS);

  test(
    "creates a pending CLP transaction, fetches it, and lists that day",
    async () => {
      const payku = createSandboxChileClient();
      const order = generateUniqueOrder("tx");
      const email = generateUniqueEmail("tx");
      const amount = 1000;

      let created;
      try {
        created = await payku.transactions.create({
          email,
          order,
          subject: "SDK smoke test",
          amount,
          payment: 1,
          urlreturn: "https://example.com/return",
          urlnotify: "https://example.com/notify",
        });
      } catch (error) {
        if (noteCapabilityDependent("transactions.webpay", error)) {
          return;
        }
        throw error;
      }

      expect(created.id).toBeTruthy();
      expect(created.url).toMatch(/^https?:\/\//);
      expect(INITIAL_STATUSES).toContain(created.status);

      const detail = await payku.transactions.get(created.id);
      expect(INITIAL_STATUSES).toContain(detail.status);
      expect(Number(detail.amount)).toBe(amount);
      if (typeof detail.order === "string" && detail.order.length > 0) {
        expect(detail.order).toBe(order);
      }

      const today = santiagoDateOnly();
      const listed = await payku.transactions.list({
        date_init: today,
        date_end: today,
        page: 1,
        per_page: 100,
      });

      expect(Array.isArray(listed)).toBe(true);
      const match = listed.find((item) => item.order === order);
      if (match) {
        expect(Number(match.amount)).toBe(amount);
      }
    },
    SANDBOX_TIMEOUT_MS,
  );

  test("throws PaykuAPIError for a missing transaction", async () => {
    const payku = createSandboxChileClient();

    try {
      await payku.transactions.get("trx_does_not_exist_smoke");
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(PaykuAPIError);
      const err = error as PaykuAPIError;
      const response = err.response;
      if (
        response !== null &&
        typeof response === "object" &&
        "status" in response
      ) {
        expect((response as { status?: unknown }).status).toBe("failed");
      }
      expect(
        err.statusCode === 200 ||
          err.statusCode === 404 ||
          err.statusCode === 400 ||
          err.type === "Not Found" ||
          err.type === "Unprocessable Entity",
      ).toBe(true);
    }
  });
});
