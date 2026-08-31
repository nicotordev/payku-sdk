import { expect, test } from "bun:test";
import {
  createSandboxChileClient,
  describePaykuIntegration,
} from "../../test-utils/paykuIntegration";

describePaykuIntegration("integration / consumption", () => {
  test("plans.create signs /api/suplan/ and returns plan id", async () => {
    const payku = createSandboxChileClient();
    const suffix = String(Math.floor(Math.random() * 1e6)).padStart(6, "0");

    const response = await payku.consumptionSubscriptions.plans.create({
      name: `p${suffix}`,
      description: "sdk integration",
    });

    expect(response.status).toBe("success");
    expect(response.id).toMatch(/^pl/);
  });
});
