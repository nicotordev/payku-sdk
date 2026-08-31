import { expect, test } from "bun:test";
import { PaykuError } from "../../errors";
import {
  createSandboxChileClient,
  describePaykuIntegration,
} from "../../test-utils/paykuIntegration";

describePaykuIntegration("integration / subscriptions", () => {
  test("plans.list returns envelope or PaykuError (account-dependent)", async () => {
    const payku = createSandboxChileClient();

    try {
      const response = await payku.subscriptions.plans.list();
      expect(response).toBeDefined();
      expect(response.status).toBeTruthy();
    } catch (error) {
      expect(error).toBeInstanceOf(PaykuError);
    }
  });
});
