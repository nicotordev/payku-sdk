import { expect, test } from "bun:test";
import { PaykuError } from "../../errors";
import {
  createSandboxChileClient,
  describePaykuIntegration,
} from "../../test-utils/paykuIntegration";

describePaykuIntegration("integration / nullification", () => {
  test("get missing id throws PaykuError", async () => {
    const payku = createSandboxChileClient();

    await expect(
      payku.nullification.get("trx_does_not_exist_nullify"),
    ).rejects.toBeInstanceOf(PaykuError);
  });
});
