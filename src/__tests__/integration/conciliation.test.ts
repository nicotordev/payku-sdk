import { expect, test } from "bun:test";
import { PaykuError } from "../../errors";
import {
  createSandboxChileClient,
  describePaykuIntegration,
} from "../../test-utils/paykuIntegration";

describePaykuIntegration("integration / conciliation", () => {
  test("create returns conciliation envelope or PaykuError", async () => {
    const payku = createSandboxChileClient();
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - 7);

    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    try {
      const response = await payku.conciliation.create({
        date_init: fmt(start),
        date_end: fmt(end),
      });

      expect(Array.isArray(response.conciliation)).toBe(true);
    } catch (error) {
      expect(error).toBeInstanceOf(PaykuError);
    }
  });
});
