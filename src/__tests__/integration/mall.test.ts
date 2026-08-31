import { expect, test } from "bun:test";
import { PaykuError } from "../../errors";
import {
  createSandboxChileClient,
  describePaykuIntegration,
} from "../../test-utils/paykuIntegration";

describePaykuIntegration("integration / mall", () => {
  test("get missing id throws PaykuError", async () => {
    const payku = createSandboxChileClient();

    await expect(payku.mall.get("mall_does_not_exist_smoke")).rejects.toBeInstanceOf(
      PaykuError,
    );
  });
});
