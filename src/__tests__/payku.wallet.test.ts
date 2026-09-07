import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import Payku from "../clients/payku";
import PaykuWallet from "../clients/payku.wallet";
import { PaykuUnsupportedFeatureError, PaykuWalletError } from "../errors";
import { HttpClient } from "../http/client";
import {
  PAYKU_WALLET_SANDBOX_AMOUNTS,
  type PaykuGetPayoutResponse,
  type PaykuGetPayoutV3Response,
  type PaykuWalletBalanceResponse,
  type PaykuWalletListResponse,
} from "../types/payku.wallet";

import balanceFixture from "./fixtures/chile/wallet/balance-200.json";
import movementsGetFixture from "./fixtures/chile/wallet/movements-get-200.json";
import movementsListFixture from "./fixtures/chile/wallet/movements-list-200.json";
import payoutCreateFixture from "./fixtures/chile/wallet/payout-create-200.json";
import payoutGetFixture from "./fixtures/chile/wallet/payout-get-200.json";
import payoutGetV3Fixture from "./fixtures/chile/wallet/payout-getv3-200.json";
import payoutNotifyRejectedFixture from "./fixtures/chile/wallet/payout-notify-rejected.json";
import payoutNotifySuccessFixture from "./fixtures/chile/wallet/payout-notify-success.json";
import withdrawCreateFixture from "./fixtures/chile/wallet/withdraw-create-200.json";

describe("PaykuWallet withdraw", () => {
  let mock: InstanceType<typeof MockAdapter>;
  let apiAxios: ReturnType<typeof axios.create>;
  let wallet: PaykuWallet;

  beforeEach(() => {
    apiAxios = axios.create({
      baseURL: "https://des.payku.cl/api",
    });
    mock = new MockAdapter(apiAxios);

    const http = new HttpClient({
      baseUrl: "https://des.payku.cl/api",
      rootUrl: "https://des.payku.cl",
      publicToken: "public-token",
      privateToken: "private-token",
      axiosInstance: apiAxios,
      rootAxiosInstance: apiAxios,
    });

    wallet = new PaykuWallet(http);
  });

  afterEach(() => {
    mock.restore();
  });

  test("create posts documented minimal body on /wallet/withdraw with signed: true", async () => {
    mock.onPost("/wallet/withdraw").reply((config) => {
      expect(config.headers?.Authorization).toBe("Bearer public-token");
      expect(config.headers?.Sign).toMatch(/^[a-f0-9]{64}$/);

      const body = JSON.parse(String(config.data)) as Record<string, unknown>;
      expect(body).toEqual({
        subject: "withdraw 133222",
        currency: "CLP",
        order: "133222",
        amount: 1000,
      });
      expect(body).not.toHaveProperty("email");
      expect(body).not.toHaveProperty("accountbank_name");
      expect(body).not.toHaveProperty("accountbank_rut");
      expect(body).not.toHaveProperty("accountbank_sbif");
      expect(body).not.toHaveProperty("accountbank_type");
      expect(body).not.toHaveProperty("accountbank_num");

      return [200, withdrawCreateFixture];
    });

    const response = await wallet.withdraw.create({
      subject: "withdraw 133222",
      currency: "CLP",
      order: "133222",
      amount: 1000,
    });

    expect(response.status).toBe("success");
    expect(response.identifier_wallet).toBe("wab5f7232dafff18f9");
    expect(response).not.toHaveProperty("identifier_payout");
  });
});

describe("PaykuWallet payout create", () => {
  let mock: InstanceType<typeof MockAdapter>;
  let apiAxios: ReturnType<typeof axios.create>;
  let wallet: PaykuWallet;

  beforeEach(() => {
    apiAxios = axios.create({
      baseURL: "https://des.payku.cl/api",
    });
    mock = new MockAdapter(apiAxios);

    const http = new HttpClient({
      baseUrl: "https://des.payku.cl/api",
      rootUrl: "https://des.payku.cl",
      publicToken: "public-token",
      privateToken: "private-token",
      axiosInstance: apiAxios,
      rootAxiosInstance: apiAxios,
    });

    wallet = new PaykuWallet(http);
  });

  afterEach(() => {
    mock.restore();
  });

  test("create sends signed POST /wallet/payout with order_ext and maps fixture", async () => {
    mock.onPost("/wallet/payout").reply((config) => {
      expect(config.headers?.Authorization).toBe("Bearer public-token");
      expect(config.headers?.Sign).toMatch(/^[a-f0-9]{64}$/);

      const body = JSON.parse(String(config.data)) as Record<string, unknown>;
      expect(body).toMatchObject({
        email: "test@test.com",
        subject: "payout order",
        currency: "CLP",
        order: "367734544",
        amount: 1000,
        accountbank_name: "test",
        accountbank_rut: "111111111",
        accountbank_sbif: "0001",
        accountbank_type: "1",
        accountbank_num: "123123123",
        order_ext: "ext-order-999",
      });

      return [200, payoutCreateFixture];
    });

    const response = await wallet.payouts.create({
      email: "test@test.com",
      subject: "payout order",
      currency: "CLP",
      order: "367734544",
      amount: 1000,
      accountbank_name: "test",
      accountbank_rut: "111111111",
      accountbank_sbif: "0001",
      accountbank_type: "1",
      accountbank_num: "123123123",
      order_ext: "ext-order-999",
    });

    expect(response).toEqual(payoutCreateFixture);
    expect(response.identifier_wallet).toBe("wab5f7232dafff18f9");
    expect(response.identifier_payout).toBe("mor33e36b01e8a11b9ee");
  });

  test("validation: throws error when Banco Estado (SBIF 0012) account number exceeds 12 digits", async () => {
    // 16 dígitos = número de tarjeta de débito
    await expect(
      wallet.payouts.create({
        email: "test@test.com",
        subject: "payout order",
        currency: "CLP",
        order: "367734544",
        amount: 1000,
        accountbank_name: "test",
        accountbank_rut: "111111111",
        accountbank_sbif: "0012",
        accountbank_type: "2",
        accountbank_num: "1234567890123456",
      }),
    ).rejects.toThrow(PaykuWalletError);
  });

  test("validation: accepts Banco Estado (SBIF 0012) account number with <= 12 digits", async () => {
    mock.onPost("/wallet/payout").reply(200, payoutCreateFixture);

    const response = await wallet.payouts.create({
      email: "test@test.com",
      subject: "payout order",
      currency: "CLP",
      order: "367734544",
      amount: 1000,
      accountbank_name: "test",
      accountbank_rut: "111111111",
      accountbank_sbif: "0012",
      accountbank_type: "2",
      accountbank_num: "123456789012", // exactamente 12
    });

    expect(response.status).toBe("success");
  });

  test("validation: accepts other banks with > 12 digits", async () => {
    mock.onPost("/wallet/payout").reply(200, payoutCreateFixture);

    const response = await wallet.payouts.create({
      email: "test@test.com",
      subject: "payout order",
      currency: "CLP",
      order: "367734544",
      amount: 1000,
      accountbank_name: "test",
      accountbank_rut: "111111111",
      accountbank_sbif: "0001", // Banco de Chile
      accountbank_type: "1",
      accountbank_num: "12345678901234567",
    });

    expect(response.status).toBe("success");
  });
});

describe("PaykuWallet payout get and getV3", () => {
  let mock: InstanceType<typeof MockAdapter>;
  let apiAxios: ReturnType<typeof axios.create>;
  let wallet: PaykuWallet;

  beforeEach(() => {
    apiAxios = axios.create({
      baseURL: "https://des.payku.cl/api",
    });
    mock = new MockAdapter(apiAxios);

    const http = new HttpClient({
      baseUrl: "https://des.payku.cl/api",
      rootUrl: "https://des.payku.cl",
      publicToken: "public-token",
      privateToken: "private-token",
      axiosInstance: apiAxios,
      rootAxiosInstance: apiAxios,
    });

    wallet = new PaykuWallet(http);
  });

  afterEach(() => {
    mock.restore();
  });

  test("get sends signed GET /payout/{id} and maps nested payout fixture", async () => {
    mock.onGet("/payout/war3999847529816f2").reply((config) => {
      expect(config.headers?.Authorization).toBe("Bearer public-token");
      expect(config.headers?.Sign).toMatch(/^[a-f0-9]{64}$/);
      return [200, payoutGetFixture];
    });

    const response = await wallet.payouts.get("war3999847529816f2");

    expect(response).toEqual(payoutGetFixture as PaykuGetPayoutResponse);
    expect(response.payout.status).toBe("pending");
    expect(response.payout.update_at).toBe("2023-06-09 21:10:46");
  });

  test("getV3 sends signed GET /payoutv3/{id} and maps nested payout with reason_rejection", async () => {
    mock.onGet("/payoutv3/war3999847529816f2").reply((config) => {
      expect(config.headers?.Authorization).toBe("Bearer public-token");
      expect(config.headers?.Sign).toMatch(/^[a-f0-9]{64}$/);
      return [200, payoutGetV3Fixture];
    });

    const response = await wallet.payouts.getV3("war3999847529816f2");

    expect(response).toEqual(payoutGetV3Fixture as PaykuGetPayoutV3Response);
    expect(response.payout.status).toBe("banking_error");
    expect(response.payout.reason_rejection).toContain("error_creditor_account");
  });
});

describe("PaykuWallet balance and movements", () => {
  let mock: InstanceType<typeof MockAdapter>;
  let apiAxios: ReturnType<typeof axios.create>;
  let wallet: PaykuWallet;

  beforeEach(() => {
    apiAxios = axios.create({
      baseURL: "https://des.payku.cl/api",
    });
    mock = new MockAdapter(apiAxios);

    const http = new HttpClient({
      baseUrl: "https://des.payku.cl/api",
      rootUrl: "https://des.payku.cl",
      publicToken: "public-token",
      privateToken: "private-token",
      axiosInstance: apiAxios,
      rootAxiosInstance: apiAxios,
    });

    wallet = new PaykuWallet(http);
  });

  afterEach(() => {
    mock.restore();
  });

  test("balance.get sends signed GET /wallet and maps envelope", async () => {
    mock.onGet("/wallet").reply((config) => {
      expect(config.headers?.Authorization).toBe("Bearer public-token");
      expect(config.headers?.Sign).toMatch(/^[a-f0-9]{64}$/);
      return [200, balanceFixture];
    });

    const response = await wallet.balance.get();

    expect(response).toEqual(balanceFixture as PaykuWalletBalanceResponse);
    expect(response.filter?.page).toBe(1);
    expect(response.wallet_movements?.[0]?.payout?.update_at).toBe(
      "2023-06-09 21:10:46",
    );
  });

  test("movements.list sends signed GET /wallet/list and forwards query", async () => {
    mock.onGet("/wallet/list").reply((config) => {
      expect(config.headers?.Authorization).toBe("Bearer public-token");
      expect(config.headers?.Sign).toMatch(/^[a-f0-9]{64}$/);
      expect(config.params).toMatchObject({ page: 1, per_page: 10, currency: "CLP" });
      return [200, movementsListFixture];
    });

    const response = await wallet.movements.list({
      page: 1,
      per_page: 10,
      currency: "CLP",
    });

    expect(response.current_id).toBe("wa8a6171ab83323c37");
    expect(response.amount_available).toBe(1766);
    expect(response.filter?.currency).toBe("CLP");
  });

  test("movements.get sends signed GET /wallet/{id} and maps detail", async () => {
    mock.onGet("/wallet/wa8a6171ab83323c37").reply((config) => {
      expect(config.headers?.Authorization).toBe("Bearer public-token");
      expect(config.headers?.Sign).toMatch(/^[a-f0-9]{64}$/);
      return [200, movementsGetFixture];
    });

    const response = await wallet.movements.get("wa8a6171ab83323c37");

    expect(response).toEqual(movementsGetFixture as PaykuWalletListResponse);
    expect(response.current_id).toBe("wa8a6171ab83323c37");
  });
});

describe("PaykuWallet payouts.verifyNotify", () => {
  let mock: InstanceType<typeof MockAdapter>;
  let apiAxios: ReturnType<typeof axios.create>;
  let wallet: PaykuWallet;

  beforeEach(() => {
    apiAxios = axios.create({
      baseURL: "https://des.payku.cl/api",
    });
    mock = new MockAdapter(apiAxios);

    const http = new HttpClient({
      baseUrl: "https://des.payku.cl/api",
      rootUrl: "https://des.payku.cl",
      publicToken: "public-token",
      privateToken: "private-token",
      axiosInstance: apiAxios,
      rootAxiosInstance: apiAxios,
    });

    wallet = new PaykuWallet(http);
  });

  afterEach(() => {
    mock.restore();
  });

  test("returns valid: true when status matches via GET /payout/{id}", async () => {
    mock.onGet("/payout/mor33e36b01e8a11b9ee").reply(200, {
      payout: {
        id: "mor33e36b01e8a11b9ee",
        status: "success",
        update_at: "2023-08-24 12:29:35",
      },
    });

    const result = await wallet.payouts.verifyNotify(payoutNotifySuccessFixture);

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.payout.status).toBe("success");
      expect(result.notify.order).toBe("367734544");
    }
  });

  test("supports useV3: true to consult /payoutv3/{id}", async () => {
    mock.onGet("/payoutv3/mor33e36b01e8a11b9ee").reply(200, {
      payout: {
        id: "mor33e36b01e8a11b9ee",
        status: "banking_error",
        reason_rejection: "Cuenta inexistente",
      },
    });

    const result = await wallet.payouts.verifyNotify(payoutNotifyRejectedFixture, {
      useV3: true,
    });

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.payout.status).toBe("banking_error");
      expect((result.payout as { reason_rejection?: string }).reason_rejection).toBe(
        "Cuenta inexistente",
      );
    }
  });

  test("returns missing_id when payload has neither id nor identifier_payout", async () => {
    const invalidPayload = {
      order: "123",
      status: "success",
    } as any;

    const result = await wallet.payouts.verifyNotify(invalidPayload);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe("missing_id");
    }
  });

  test("returns status_mismatch when status in API differs from payload", async () => {
    mock.onGet("/payout/mor33e36b01e8a11b9ee").reply(200, {
      payout: {
        id: "mor33e36b01e8a11b9ee",
        status: "banking_error",
      },
    });

    const result = await wallet.payouts.verifyNotify(payoutNotifySuccessFixture);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe("status_mismatch");
      expect(result.payout?.status).toBe("banking_error");
    }
  });

  test("returns order_mismatch when expectedOrder does not match payload.order", async () => {
    mock.onGet("/payout/mor33e36b01e8a11b9ee").reply(200, {
      payout: {
        id: "mor33e36b01e8a11b9ee",
        status: "success",
      },
    });

    const result = await wallet.payouts.verifyNotify(payoutNotifySuccessFixture, {
      expectedOrder: "different-order",
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe("order_mismatch");
    }
  });

  test("returns payku_api_error when Payku API returns 404 or 500", async () => {
    mock.onGet("/payout/mor33e36b01e8a11b9ee").reply(404, {
      status: "register not found",
    });

    const result = await wallet.payouts.verifyNotify(payoutNotifySuccessFixture);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe("payku_api_error");
      expect(result.error).toBeDefined();
    }
  });
});

describe("Payku.forCountry wallet scoped integration", () => {
  test("Payku.forCountry('CL').wallet exposes withdraw, payouts, balance and movements", async () => {
    const cl = Payku.forCountry("CL", {
      publicToken: "pub",
      privateToken: "priv",
    });

    expect(cl.wallet).toBeDefined();
    expect(typeof cl.wallet.withdraw.create).toBe("function");
    expect(typeof cl.wallet.payouts.create).toBe("function");
    expect(typeof cl.wallet.payouts.verifyNotify).toBe("function");
    expect(typeof cl.wallet.balance.get).toBe("function");
    expect(typeof cl.wallet.movements.list).toBe("function");
  });

  test("Payku.forCountry('PE').wallet throws PaykuUnsupportedFeatureError on withdraw", () => {
    const pe = Payku.forCountry("PE", {
      publicToken: "pub",
      privateToken: "priv",
    });

    expect(() => pe.wallet.withdraw).toThrow(PaykuUnsupportedFeatureError);
    expect(typeof pe.wallet.payouts.create).toBe("function");
    expect(typeof pe.wallet.payouts.verifyNotify).toBe("function");
    expect(typeof pe.wallet.balance.get).toBe("function");
    expect(typeof pe.wallet.movements.list).toBe("function");
  });

  test("Payku.forCountry('VE').wallet throws PaykuUnsupportedFeatureError on withdraw", () => {
    const ve = Payku.forCountry("VE", {
      publicToken: "pub",
      privateToken: "priv",
    });

    expect(() => ve.wallet.withdraw).toThrow(PaykuUnsupportedFeatureError);
    expect(typeof ve.wallet.payouts.create).toBe("function");
    expect(typeof ve.wallet.payouts.verifyNotify).toBe("function");
  });

  test("PAYKU_WALLET_SANDBOX_AMOUNTS contains documented auto-approved and auto-rejected amounts", () => {
    expect(PAYKU_WALLET_SANDBOX_AMOUNTS.APPROVED).toEqual([1000, 2000, 3000]);
    expect(PAYKU_WALLET_SANDBOX_AMOUNTS.REJECTED).toEqual([1500, 2500, 3500]);
  });
});
