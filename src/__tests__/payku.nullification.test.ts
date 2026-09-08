import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import Payku from "../clients/payku";
import PaykuNullification from "../clients/payku.nullification";
import { PaykuNullificationError } from "../errors";
import { HttpClient } from "../http/client";
import type {
  PaykuCreateNullificationResponse,
  PaykuGetNullificationResponse,
  PaykuNullificationCallbackPayload,
} from "../types/payku.nullification";

import callbackFixture from "./fixtures/chile/nullification/callback-200.json";
import createFixture from "./fixtures/chile/nullification/create-200.json";
import error401Fixture from "./fixtures/chile/nullification/401.json";
import getFixture from "./fixtures/chile/nullification/get-200.json";

describe("PaykuNullification create", () => {
  let mock: InstanceType<typeof MockAdapter>;
  let apiAxios: ReturnType<typeof axios.create>;
  let nullification: PaykuNullification;

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

    nullification = new PaykuNullification(http);
  });

  afterEach(() => {
    mock.restore();
  });

  test("sends signed POST /nullification and maps create-200 fixture", async () => {
    mock.onPost("/nullification").reply((config) => {
      expect(config.headers?.Authorization).toBe("Bearer public-token");
      expect(config.headers?.Sign).toMatch(/^[a-f0-9]{64}$/);

      const body = JSON.parse(String(config.data)) as Record<string, unknown>;
      expect(body).toEqual({
        id: "trxpr2a45s1dytg1",
        amount: 25000,
        subject: "anulación transacción",
      });

      return [200, createFixture];
    });

    const response = await nullification.create({
      id: "trxpr2a45s1dytg1",
      amount: 25000,
      subject: "anulación transacción",
    });

    expect(response).toEqual(createFixture as PaykuCreateNullificationResponse);
    expect(response.status).toBe("success");
    expect(response.nullify.id).toBe("trxpr2a45s1dytg1");
    expect(response.nullify.status_nullify).toBe("complete");
    expect(response.gateway_response?.status).toBe(
      "Successfully registered request",
    );
  });

  test("throws PaykuNullificationError on 401 waiting sign", async () => {
    mock.onPost("/nullification").reply(401, error401Fixture);

    try {
      await nullification.create({
        id: "trxpr2a45s1dytg1",
        amount: 25000,
        subject: "anulación transacción",
      });
      expect.unreachable("should have thrown PaykuNullificationError");
    } catch (error) {
      expect(error).toBeInstanceOf(PaykuNullificationError);
      const nullifyError = error as PaykuNullificationError;
      expect(nullifyError.statusCode).toBe(401);
    }
  });

  describe("validations", () => {
    test("throws PaykuNullificationError when id is empty", async () => {
      await expect(
        nullification.create({
          id: "",
          amount: 25000,
          subject: "anulación",
        }),
      ).rejects.toThrow(PaykuNullificationError);
    });

    test("throws PaykuNullificationError when amount is not positive", async () => {
      await expect(
        nullification.create({
          id: "trx123",
          amount: 0,
          subject: "anulación",
        }),
      ).rejects.toThrow(PaykuNullificationError);

      await expect(
        nullification.create({
          id: "trx123",
          amount: -500,
          subject: "anulación",
        }),
      ).rejects.toThrow(PaykuNullificationError);
    });

    test("throws PaykuNullificationError when subject is empty", async () => {
      await expect(
        nullification.create({
          id: "trx123",
          amount: 25000,
          subject: "   ",
        }),
      ).rejects.toThrow(PaykuNullificationError);
    });
  });
});

describe("PaykuNullification get", () => {
  let mock: InstanceType<typeof MockAdapter>;
  let apiAxios: ReturnType<typeof axios.create>;
  let nullification: PaykuNullification;

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

    nullification = new PaykuNullification(http);
  });

  afterEach(() => {
    mock.restore();
  });

  test("sends signed GET /nullification/:id and maps get-200 fixture", async () => {
    mock.onGet("/nullification/trxpr2a45s1dytg1").reply((config) => {
      expect(config.headers?.Authorization).toBe("Bearer public-token");
      expect(config.headers?.Sign).toMatch(/^[a-f0-9]{64}$/);
      return [200, getFixture];
    });

    const response = await nullification.get("trxpr2a45s1dytg1");

    expect(response).toEqual(getFixture as PaykuGetNullificationResponse);
    expect(response.nullify.id).toBe("trxpr2a45s1dytg1");
    expect(response.nullify.amount).toBe(25000);
    expect(response.nullify.status_nullify).toBe("complete");
    expect(response.nullify.currency).toBe("CLP");
  });

  test("throws PaykuNullificationError on 404 or API error", async () => {
    mock.onGet("/nullification/non-existent").reply(404, {
      status: "failed",
      message: "not found",
    });

    try {
      await nullification.get("non-existent");
      expect.unreachable("should have thrown PaykuNullificationError");
    } catch (error) {
      expect(error).toBeInstanceOf(PaykuNullificationError);
      const nullifyError = error as PaykuNullificationError;
      expect(nullifyError.statusCode).toBe(404);
    }
  });

  test("throws PaykuNullificationError when id is blank", async () => {
    await expect(nullification.get("   ")).rejects.toThrow(
      PaykuNullificationError,
    );
  });
});

describe("PaykuNullification verifyCallback", () => {
  let mock: InstanceType<typeof MockAdapter>;
  let apiAxios: ReturnType<typeof axios.create>;
  let nullification: PaykuNullification;

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

    nullification = new PaykuNullification(http);
  });

  afterEach(() => {
    mock.restore();
  });

  test("returns valid: true when re-queried status and amount match", async () => {
    mock.onGet("/nullification/trxpr2a45s1dytg1").reply(200, getFixture);

    const result = await nullification.verifyCallback(callbackFixture);

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.nullify.id).toBe("trxpr2a45s1dytg1");
      expect(result.nullify.status_nullify).toBe("complete");
      expect(result.callback.ordencompra).toBe("367734544");
    }
  });

  test("verifyNotify is an alias of verifyCallback", async () => {
    mock.onGet("/nullification/trxpr2a45s1dytg1").reply(200, getFixture);

    const result = await nullification.verifyNotify(callbackFixture);

    expect(result.valid).toBe(true);
  });

  test("returns missing_id when both id and id_transaction are omitted", async () => {
    const invalidPayload = {
      ordencompra: "367734544",
      monto: 25000,
      status: "complete",
    } as unknown as PaykuNullificationCallbackPayload;

    const result = await nullification.verifyCallback(invalidPayload);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe("missing_id");
    }
  });

  test("returns id_mismatch when id and id_transaction differ", async () => {
    const invalidPayload: PaykuNullificationCallbackPayload = {
      id: "trx_1",
      id_transaction: "trx_2",
      monto: 25000,
      status: "complete",
    };

    const result = await nullification.verifyCallback(invalidPayload);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe("id_mismatch");
    }
  });

  test("returns id_mismatch when API response contains different nullify.id", async () => {
    mock.onGet("/nullification/trxpr2a45s1dytg1").reply(200, {
      nullify: {
        ...getFixture.nullify,
        id: "different_id_999",
      },
    });

    const result = await nullification.verifyCallback(callbackFixture);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe("id_mismatch");
    }
  });

  test("returns missing_amount when payload monto is missing or not finite", async () => {
    const invalidPayload = {
      id: "trxpr2a45s1dytg1",
      status: "complete",
    } as unknown as PaykuNullificationCallbackPayload;

    const result = await nullification.verifyCallback(invalidPayload);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe("missing_amount");
    }

    const invalidAmountPayload = {
      id: "trxpr2a45s1dytg1",
      status: "complete",
      monto: NaN,
    } as unknown as PaykuNullificationCallbackPayload;

    const result2 = await nullification.verifyCallback(invalidAmountPayload);
    expect(result2.valid).toBe(false);
    if (!result2.valid) {
      expect(result2.reason).toBe("missing_amount");
    }
  });

  test("handles non-string status in payload gracefully without throw", async () => {
    mock.onGet("/nullification/trxpr2a45s1dytg1").reply(200, getFixture);

    const nonStringStatusPayload = {
      id: "trxpr2a45s1dytg1",
      monto: 25000,
      status: 12345 as unknown as string,
    };

    const result = await nullification.verifyCallback(nonStringStatusPayload);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe("status_mismatch");
    }
  });

  test("returns missing_status when payload status is missing and expectedStatus is omitted", async () => {
    const invalidPayload = {
      id: "trxpr2a45s1dytg1",
      monto: 25000,
    } as unknown as PaykuNullificationCallbackPayload;

    const result = await nullification.verifyCallback(invalidPayload);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe("missing_status");
    }
  });

  test("returns status_mismatch when API status does not match callback status", async () => {
    mock.onGet("/nullification/trxpr2a45s1dytg1").reply(200, {
      nullify: {
        ...getFixture.nullify,
        status_nullify: "pending",
      },
    });

    const result = await nullification.verifyCallback(callbackFixture);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe("status_mismatch");
      expect(result.nullify?.status_nullify).toBe("pending");
    }
  });

  test("returns amount_mismatch when API amount differs from payload monto or expectedAmount", async () => {
    mock.onGet("/nullification/trxpr2a45s1dytg1").reply(200, {
      nullify: {
        ...getFixture.nullify,
        amount: 10000,
      },
    });

    const result = await nullification.verifyCallback(callbackFixture);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe("amount_mismatch");
      expect(result.nullify?.amount).toBe(10000);
    }
  });

  test("returns payku_api_error when GET /nullification/:id returns 404 or 500", async () => {
    mock.onGet("/nullification/trxpr2a45s1dytg1").reply(500, {
      status: "failed",
      message: "internal error",
    });

    const result = await nullification.verifyCallback(callbackFixture);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe("payku_api_error");
      expect(result.error?.statusCode).toBe(500);
    }
  });
});

describe("Payku.forCountry nullification integration", () => {
  test("Payku.forCountry('CL').nullification is an instance of PaykuNullification", () => {
    const paykuCL = Payku.forCountry("CL", {
      publicToken: "public-token",
      privateToken: "private-token",
    });
    expect(paykuCL.nullification).toBeInstanceOf(PaykuNullification);
  });

  test("Payku.forCountry('PE') and 'VE' do not expose nullification", () => {
    const paykuPE = Payku.forCountry("PE", {
      publicToken: "public-token",
      privateToken: "private-token",
    });
    const paykuVE = Payku.forCountry("VE", {
      publicToken: "public-token",
      privateToken: "private-token",
    });

    expect("nullification" in paykuPE).toBe(false);
    expect("nullification" in paykuVE).toBe(false);
  });
});
