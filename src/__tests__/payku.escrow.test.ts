import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import PaykuEscrow from "../clients/payku.escrow";
import { PaykuEscrowError } from "../errors";
import { HttpClient } from "../http/client";

import authorize200Fixture from "./fixtures/chile/escrow/authorize-200.json";
import authorize401Fixture from "./fixtures/chile/escrow/authorize-401.json";
import Payku from "../clients/payku";

describe("PaykuEscrow authorize", () => {
  let mock: InstanceType<typeof MockAdapter>;
  let apiAxios: ReturnType<typeof axios.create>;
  let escrow: PaykuEscrow;

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

    escrow = new PaykuEscrow(http);
  });

  afterEach(() => {
    mock.restore();
  });

  test("authorize posts transactions array (not transaction)", async () => {
    mock.onPost("/escrow").reply((config) => {
      expect(config.headers?.Authorization).toBe("Bearer public-token");

      const body = JSON.parse(String(config.data)) as Record<string, unknown>;
      expect(body).toEqual({
        transactions: [
          "trx3b4d77b43acd9a720",
          "trx3b4d77b43acd9a385",
        ],
      });
      expect(body).not.toHaveProperty("transaction");

      return [200, authorize200Fixture];
    });

    await escrow.authorize({
      transactions: [
        "trx3b4d77b43acd9a720",
        "trx3b4d77b43acd9a385",
      ],
    });
  });

  test("authorize maps transactions settlement fixture", async () => {
    mock.onPost("/escrow").reply(200, authorize200Fixture);

    const response = await escrow.authorize({
      transactions: [
        "trx3b4d77b43acd9a720",
        "trx3b4d77b43acd9a385",
      ],
    });

    expect(response).toEqual(authorize200Fixture);
    expect(response.transactions[0]?.status).toBe("liquidate");
    expect(response.transactions[1]?.deposit_date).toBe("N/D");
  });

  test("authorize throws PaykuEscrowError on 401 Unauthorized", async () => {
    mock.onPost("/escrow").reply(401, authorize401Fixture);

    try {
      await escrow.authorize({
        transactions: ["trx3b4d77b43acd9a720"],
      });
      expect.unreachable("should have thrown PaykuEscrowError");
    } catch (error) {
      expect(error).toBeInstanceOf(PaykuEscrowError);
      const escrowError = error as PaykuEscrowError;
      expect(escrowError.statusCode).toBe(401);
    }
  });

  describe("validations", () => {
    test("authorize throws PaykuEscrowError when transactions is empty or not an array", async () => {
      await expect(
        escrow.authorize({ transactions: [] }),
      ).rejects.toThrow(PaykuEscrowError);

      await expect(
        escrow.authorize({ transactions: null as unknown as string[] }),
      ).rejects.toThrow(PaykuEscrowError);

      expect(mock.history.post.length).toBe(0);
    });

    test("authorize throws PaykuEscrowError when transaction id is empty or non-string", async () => {
      await expect(
        escrow.authorize({ transactions: ["trx1", "  "] }),
      ).rejects.toThrow(PaykuEscrowError);

      await expect(
        escrow.authorize({ transactions: ["trx1", 123 as unknown as string] }),
      ).rejects.toThrow(PaykuEscrowError);

      await expect(
        escrow.authorize({ transactions: ["trx1", true as unknown as string] }),
      ).rejects.toThrow(PaykuEscrowError);

      expect(mock.history.post.length).toBe(0);
    });
  });
});

describe("Payku.forCountry escrow integration", () => {
  test("Payku.forCountry('CL').escrow is an instance of PaykuEscrow", () => {
    const paykuCL = Payku.forCountry("CL", {
      publicToken: "public-token",
      privateToken: "private-token",
    });
    expect(paykuCL.escrow).toBeInstanceOf(PaykuEscrow);
  });

  test("Payku.forCountry('PE') and 'VE' do not expose escrow", () => {
    const paykuPE = Payku.forCountry("PE", {
      publicToken: "public-token",
      privateToken: "private-token",
    });
    const paykuVE = Payku.forCountry("VE", {
      publicToken: "public-token",
      privateToken: "private-token",
    });

    expect("escrow" in paykuPE).toBe(false);
    expect("escrow" in paykuVE).toBe(false);
  });
});
