import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import PaykuConsumptionSubscriptions from "../clients/payku.consumption-subscriptions";
import { HttpClient } from "../http/client";
import { buildSign } from "../http/sign";

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

  test("plans.create posts body on /suplan/ with Sign /api/suplan/", async () => {
    const body = { name: "Test plan", description: "Test Plan" };

    mock.onPost("/suplan/").reply((config) => {
      const expectedSign = buildSign("/api/suplan/", body, "private-token");
      expect(config.headers?.Sign).toBe(expectedSign);
      expect(JSON.parse(String(config.data))).toEqual(body);
      return [200, { status: "success", id: "pl4293e97a87195bb9edcd" }];
    });

    const response = await consumption.plans.create(body);

    expect(response).toEqual({
      status: "success",
      id: "pl4293e97a87195bb9edcd",
    });
  });

  test("clients.create maps active fixture with subcriptions/update_at typos", async () => {
    const request = {
      email: "johndoe@example.com",
      name: "John Doe",
      phone: "923122312",
      rut: "11111111",
    };

    mock.onPost("/suclient/").reply((config) => {
      const expectedSign = buildSign(
        "/api/suclient/",
        request,
        "private-token",
      );
      expect(config.headers?.Sign).toBe(expectedSign);
      return [
        200,
        {
          status: "active",
          id: "cl0be4c8e623c167bc8b777",
          rut: "11111111",
          name: "John Doe",
          phone: "923122312",
          email: "johndoe@example.com",
          created_at: "2023-09-29",
          update_at: null,
          subcriptions: null,
        },
      ];
    });

    const response = await consumption.clients.create(request);

    expect(response.status).toBe("active");
    expect(response.id).toBe("cl0be4c8e623c167bc8b777");
    expect(response.subcriptions).toBeNull();
    expect(response.update_at).toBeNull();
  });

  test("subscriptions.create maps register url fixture on /sususcription/", async () => {
    const body = {
      plan: "pl9697fb170834ad42dd00",
      client: "cl9b1e1dd988694f30fa30",
    };

    mock.onPost("/sususcription/").reply((config) => {
      const expectedSign = buildSign(
        "/api/sususcription/",
        body,
        "private-token",
      );
      expect(config.headers?.Sign).toBe(expectedSign);
      return [
        200,
        {
          status: "register",
          id: "sucaab7865dceaff49d8b3",
          url: "http://des.payku.cl/gateway/registrosuscripcion",
        },
      ];
    });

    const response = await consumption.subscriptions.create(body);

    expect(response.status).toBe("register");
    expect(response.id).toBe("sucaab7865dceaff49d8b3");
    expect(response.url).toContain("registrosuscripcion");
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
          verification_key:
            "025dcad37e071daa8bfc2df35189009db65692a4ff766856108be1675e870839",
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
      return [200, { status: "Delete", card: "surec804a8ed60c747cb8839" }];
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
