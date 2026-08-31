import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import PaykuConciliation from "../clients/payku.conciliation";
import { HttpClient } from "../http/client";

const conciliationFixture = {
  conciliation: [
    {
      id: "107999",
      created_at: "2019-10-25 14:10:03",
      amount_available: 98745,
      amount_deposit: 0,
      status: "pending",
      destiny: "wallet",
      currency: "CLP",
      wallet: null,
      transaction: [
        {
          transaction_id: "rsyt68j4dhg6k8j54ut698dt6hj84",
          payment_key: "pra934939d607922f9e",
          order: "6544",
          start: "2023-12-16 15:10:33",
          end: "2023-12-16 15:10:36",
          deposit_date: "2023-10-05",
          amount: 250000,
          fee: 15000,
          amount_deposit: 235000,
          media: "Webpay",
        },
      ],
    },
  ],
};

describe("PaykuConciliation", () => {
  let mock: InstanceType<typeof MockAdapter>;
  let apiAxios: ReturnType<typeof axios.create>;
  let conciliation: PaykuConciliation;

  beforeEach(() => {
    apiAxios = axios.create({ baseURL: "https://des.payku.cl/api" });
    mock = new MockAdapter(apiAxios);
    const http = new HttpClient({
      baseUrl: "https://des.payku.cl/api",
      rootUrl: "https://des.payku.cl",
      publicToken: "public-token",
      privateToken: "private-token",
      axiosInstance: apiAxios,
      rootAxiosInstance: apiAxios,
    });
    conciliation = new PaykuConciliation(http);
  });

  afterEach(() => {
    mock.restore();
  });

  test("create posts date range and maps conciliation[] fixture", async () => {
    mock.onPost("/conciliation").reply((config) => {
      expect(JSON.parse(String(config.data))).toEqual({
        date_init: "2023-10-20",
        date_end: "2023-10-21",
      });
      expect(config.headers?.Sign).toBeUndefined();
      return [200, conciliationFixture];
    });

    const response = await conciliation.create({
      date_init: "2023-10-20",
      date_end: "2023-10-21",
    });

    expect(response.conciliation).toHaveLength(1);
    expect(response.conciliation[0]?.status).toBe("pending");
    expect(response.conciliation[0]?.transaction?.[0]?.transaction_id).toBe(
      "rsyt68j4dhg6k8j54ut698dt6hj84",
    );
    expect(response.conciliation[0]?.transaction?.[0]?.amount).toBe(250000);
  });
});
