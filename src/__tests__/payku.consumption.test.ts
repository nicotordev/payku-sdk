import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import PaykuConsumptionSubscriptions from "../clients/payku.consumption-subscriptions";
import { HttpClient } from "../http/client";

describe("PaykuConsumptionSubscriptions wire format", () => {
  let mock: InstanceType<typeof MockAdapter>;
  let apiAxios: ReturnType<typeof axios.create>;
  let consumption: PaykuConsumptionSubscriptions;

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

    consumption = new PaykuConsumptionSubscriptions(http);
  });

  afterEach(() => {
    mock.restore();
  });

  test("transactions.create posts suscription/marketplace/card on /sutransaction/", async () => {
    mock.onPost("/sutransaction/").reply((config) => {
      expect(config.headers?.Sign).toMatch(/^[a-f0-9]{64}$/);
      const body = JSON.parse(String(config.data)) as Record<string, unknown>;
      expect(body).toEqual({
        suscription: "sucaab7865dceaff49d8b3",
        amount: "10000",
        order: "001",
        description: "cargo consumo",
        marketplace: "ma0690b6451a7043d5",
        card: "surea041d8a4413949425fec",
      });
      expect(body).not.toHaveProperty("subscription");
      return [
        200,
        {
          status: "success",
          order: "001",
          amount: "10000",
          transaction_id: "204444",
          verification_key: "025dcad37e071daa8bfc2df35189009db65692a4ff766856108be1675e870839",
        },
      ];
    });

    const response = await consumption.transactions.create({
      suscription: "sucaab7865dceaff49d8b3",
      amount: "10000",
      order: "001",
      description: "cargo consumo",
      marketplace: "ma0690b6451a7043d5",
      card: "surea041d8a4413949425fec",
    });

    expect(response).toEqual({
      status: "success",
      order: "001",
      amount: "10000",
      transaction_id: "204444",
      verification_key:
        "025dcad37e071daa8bfc2df35189009db65692a4ff766856108be1675e870839",
    });
  });

  test("cards.delete posts { card } on /suscriptionsdeletecards/", async () => {
    mock.onPost("/suscriptionsdeletecards/").reply((config) => {
      const body = JSON.parse(String(config.data)) as Record<string, unknown>;
      expect(body).toEqual({ card: "surec804a8ed60c747cb8839" });
      expect(body).not.toHaveProperty("client");
      expect(body).not.toHaveProperty("suscription");
      return [
        200,
        { status: "Delete", card: "surec804a8ed60c747cb8839" },
      ];
    });

    const response = await consumption.cards.delete({
      card: "surec804a8ed60c747cb8839",
    });

    expect(response).toEqual({
      status: "Delete",
      card: "surec804a8ed60c747cb8839",
    });
  });
});
