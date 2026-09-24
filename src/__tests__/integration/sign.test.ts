import { expect, test } from "bun:test";
import { PaykuAPIError, createPaykuAPIError } from "../../errors";
import { HttpClient } from "../../http/client";
import {
  SANDBOX_LONG_TIMEOUT_MS,
  SANDBOX_TIMEOUT_MS,
  createSandboxChileClient,
  describePaykuIntegration,
  generateUniqueEmail,
  generateUniquePhone,
  isSignRejection,
  noteCapabilityDependent,
  paykuIntegrationConfig,
  withCleanup,
} from "../../test-utils/paykuIntegration";

describePaykuIntegration("integration / sign", () => {
  test(
    "accepts a valid signature on wallet.balance.get",
    async () => {
      const payku = createSandboxChileClient();

      try {
        const balance = await payku.wallet.balance.get();
        expect(balance).toBeDefined();
        expect(balance.status).toBeTruthy();
      } catch (error) {
        if (isSignRejection(error)) {
          throw error;
        }
        if (noteCapabilityDependent("wallet.balance", error)) {
          return;
        }
        throw error;
      }
    },
    SANDBOX_TIMEOUT_MS,
  );

  test(
    "accepts a valid signature on subscriptions.clients.create and get",
    async () => {
      const payku = createSandboxChileClient();

      await withCleanup(async (tracker) => {
        let created;
        try {
          created = await payku.subscriptions.clients.create({
            email: generateUniqueEmail("sign"),
            name: "SDK Sign Smoke",
            phone: generateUniquePhone(),
          });
        } catch (error) {
          if (isSignRejection(error)) {
            throw error;
          }
          if (noteCapabilityDependent("subscriptions.clients", error)) {
            return;
          }
          throw error;
        }

        expect(created.id).toBeTruthy();
        tracker.register(async () => {
          if (created.id) {
            await payku.subscriptions.clients.delete(created.id);
          }
        }, "delete signed suclient");

        const detail = await payku.subscriptions.clients.get(created.id!);
        expect(detail.id).toBe(created.id);
        expect(detail.email).toBeTruthy();
      });
    },
    SANDBOX_LONG_TIMEOUT_MS,
  );

  test(
    "accepts a signed nullification.get even when the id does not exist",
    async () => {
      const payku = createSandboxChileClient();

      try {
        await payku.nullification.get("trx_does_not_exist_nullify");
        expect.unreachable("missing nullification should not succeed");
      } catch (error) {
        if (noteCapabilityDependent("nullification", error)) {
          return;
        }
        expect(isSignRejection(error)).toBe(false);
        expect(error).toBeInstanceOf(PaykuAPIError);
      }
    },
    SANDBOX_TIMEOUT_MS,
  );

  test(
    "accepts a signed marketplace.clients.update when marketplace is enabled",
    async () => {
      const payku = createSandboxChileClient();

      await withCleanup(async (tracker) => {
        const banks = await payku.banks.list({ currency: "clp" });
        const sbif = banks[0]?.code;
        expect(sbif).toBeTruthy();

        let created;
        try {
          created = await payku.marketplace.clients.create({
            email: generateUniqueEmail("mkt"),
            name: "SDK Sign Smoke",
            phone: generateUniquePhone(),
            bank: {
              sbif: String(sbif),
              type: "1",
              num: "12345678",
              rut: "11111111-1",
            },
          });
        } catch (error) {
          if (isSignRejection(error)) {
            throw error;
          }
          if (noteCapabilityDependent("marketplace.clients", error)) {
            return;
          }
          throw error;
        }

        expect(created.id).toBeTruthy();
        tracker.register(async () => {
          if (created.id) {
            await payku.marketplace.clients.delete(created.id);
          }
        }, "delete marketplace client");

        const updated = await payku.marketplace.clients.update(created.id, {
          name: "SDK Sign Smoke Updated",
        });
        expect(updated.id ?? created.id).toBeTruthy();
      });
    },
    SANDBOX_LONG_TIMEOUT_MS,
  );

  test(
    "rejects a signed endpoint when the Sign header is missing",
    async () => {
      const http = new HttpClient({
        baseUrl: "https://des.payku.cl/api",
        rootUrl: "https://des.payku.cl",
        publicToken: paykuIntegrationConfig.publicToken,
        privateToken: paykuIntegrationConfig.privateToken,
      });

      try {
        await http.request({
          method: "POST",
          path: "/suclient",
          body: {
            email: generateUniqueEmail("nosign"),
            name: "SDK Missing Sign",
            phone: generateUniquePhone(),
          },
          signed: false,
        });
        expect.unreachable("sandbox should reject a missing signature");
      } catch (error) {
        const apiError = createPaykuAPIError(
          error,
          "sign.missing",
          PaykuAPIError,
        );
        expect(apiError).toBeInstanceOf(PaykuAPIError);
        expect(isSignRejection(apiError)).toBe(true);
        if (paykuIntegrationConfig.privateToken) {
          expect(
            apiError.message.includes(paykuIntegrationConfig.privateToken),
          ).toBe(false);
        }
      }
    },
    SANDBOX_TIMEOUT_MS,
  );
});
