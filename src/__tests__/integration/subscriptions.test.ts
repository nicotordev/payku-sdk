import { expect, test } from "bun:test";

import { PaykuError } from "../../errors";
import {
  SANDBOX_LONG_TIMEOUT_MS,
  createSandboxChileClient,
  describePaykuIntegration,
  generateUniqueEmail,
  generateUniquePhone,
  isSignRejection,
  noteCapabilityDependent,
  withCleanup,
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
      const err = error as PaykuError;
      expect(
        err.statusCode === 404 ||
          err.statusCode === 400 ||
          err.type === "Not Found" ||
          err.message.toLowerCase().includes("records") ||
          err.message.toLowerCase().includes("plan"),
      ).toBe(true);
    }
  });

  test(
    "creates a suclient and lists an existing plan",
    async () => {
      const payku = createSandboxChileClient();

      await withCleanup(async (tracker) => {
        let client;
        try {
          client = await payku.subscriptions.clients.create({
            email: generateUniqueEmail("sub"),
            name: "SDK Subscription Smoke",
            phone: generateUniquePhone(),
          });
        } catch (error) {
          if (isSignRejection(error)) {
            throw error;
          }
          if (noteCapabilityDependent("subscriptions", error)) {
            return;
          }
          throw error;
        }

        expect(client.id).toBeTruthy();
        const clientId = client.id!;
        tracker.register(async () => {
          await payku.subscriptions.clients.delete(clientId);
        }, "delete suclient");

        const loaded = await payku.subscriptions.clients.get(clientId);
        expect(loaded.id).toBe(clientId);

        let plans;
        try {
          plans = await payku.subscriptions.plans.list();
        } catch (error) {
          if (isSignRejection(error)) {
            throw error;
          }
          if (noteCapabilityDependent("subscriptions.plans", error)) {
            return;
          }
          if (
            error instanceof PaykuError &&
            (error.statusCode === 404 ||
              error.message.toLowerCase().includes("record"))
          ) {
            console.warn(
              "CAPABILITY_DEPENDENT subscriptions.plans: la cuenta sandbox no tiene planes",
            );
            return;
          }
          throw error;
        }

        const planList = Array.isArray(plans.plans) ? plans.plans : [];
        if (planList.length === 0) {
          console.warn(
            "CAPABILITY_DEPENDENT subscriptions.plans: la cuenta sandbox no tiene planes",
          );
          return;
        }
        expect(planList[0]?.id).toBeTruthy();
        expect(planList[0]?.status).toBeTruthy();
      });
    },
    SANDBOX_LONG_TIMEOUT_MS,
  );
});
