import { expect, test } from "bun:test";
import { PaykuError } from "../../errors";
import {
  createSandboxChileClient,
  describePaykuIntegration,
} from "../../test-utils/paykuIntegration";

describePaykuIntegration("integration / nullification", () => {
  test("get missing id throws PaykuError", async () => {
    const payku = createSandboxChileClient();

    try {
      await payku.nullification.get("trx_does_not_exist_nullify");
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
  });
});
