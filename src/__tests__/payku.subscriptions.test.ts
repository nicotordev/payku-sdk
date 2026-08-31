import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import PaykuSubscriptions from "../clients/payku.subscriptions";
import { HttpClient } from "../http/client";

describe("PaykuSubscriptions sutransaction", () => {
  let mock: InstanceType<typeof MockAdapter>;
  let apiAxios: ReturnType<typeof axios.create>;
  let subscriptions: PaykuSubscriptions;

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

    subscriptions = new PaykuSubscriptions(http);
  });

  afterEach(() => {
    mock.restore();
  });

  test("create posts suscription key (not subscription) on /sutransaction", async () => {
    mock.onPost("/sutransaction").reply((config) => {
      expect(config.headers?.Authorization).toBe("Bearer public-token");
      expect(config.headers?.Sign).toMatch(/^[a-f0-9]{64}$/);

      const body = JSON.parse(String(config.data)) as Record<string, unknown>;
      expect(body).toEqual({
        suscription: "sucaab7865dceaff49d8b3",
        amount: "10000",
        order: "001",
        description: "Descripción",
      });
      expect(body).not.toHaveProperty("subscription");

      return [
        200,
        {
          status: "success",
          order: "001",
          amount: "10000",
          transaction_id: "204444",
          verification_key:
            "025dcad37e071daa8bfc2df35189009db65692a4ff766856108be1675e870839",
        },
      ];
    });

    const response = await subscriptions.transactions.create({
      suscription: "sucaab7865dceaff49d8b3",
      amount: "10000",
      order: "001",
      description: "Descripción",
    });

    expect(response.status).toBe("success");
    expect(response.transaction_id).toBe("204444");
    expect(response.verification_key).toBeTruthy();
  });
});
