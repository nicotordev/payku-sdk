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

  test("cards.register posts suscription key on /suinscriptionscards", async () => {
    mock.onPost("/suinscriptionscards").reply((config) => {
      const body = JSON.parse(String(config.data)) as Record<string, unknown>;
      expect(body).toEqual({ suscription: "sucaab7865dceaff49d8b3" });
      expect(body).not.toHaveProperty("client");

      return [
        200,
        {
          status: "success",
          id: "surec123",
          url: "https://des.payku.cl/gateway/registercard",
        },
      ];
    });

    const response = await subscriptions.cards.register({
      suscription: "sucaab7865dceaff49d8b3",
    });

    expect(response.status).toBe("success");
    expect(response.id).toBe("surec123");
    expect(response.url).toContain("registercard");
  });

  test("cards.delete posts card key on /suscriptionsdeletecards", async () => {
    mock.onPost("/suscriptionsdeletecards").reply((config) => {
      const body = JSON.parse(String(config.data)) as Record<string, unknown>;
      expect(body).toEqual({ card: "surec123" });
      expect(body).not.toHaveProperty("client");
      expect(body).not.toHaveProperty("suscription");

      return [200, { status: "Delete", card: "surec123" }];
    });

    const response = await subscriptions.cards.delete({ card: "surec123" });

    expect(response.status).toBe("Delete");
    expect(response.card).toBe("surec123");
  });
});

describe("PaykuSubscriptions suclient", () => {
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

  test("create posts required fields and maps create fixture", async () => {
    const createFixture = {
      status: "active",
      id: "cl0be4c8e623c167bc8b777",
      rut: "11111111",
      name: "John Doe",
      phone: "923122312",
      email: "johndoe@example.com",
      address: "Moneda 101",
      country: "Chile",
      region: "Metropolitana",
      city: "Santiago",
      postal_code: "850000",
      created_at: "2023-09-29",
      update_at: null,
      subcriptions: null,
      additional_parameters: {
        parameter_1: "example",
        parameter_2: "example",
      },
    };

    mock.onPost("/suclient").reply((config) => {
      const body = JSON.parse(String(config.data)) as Record<string, unknown>;
      expect(body).toEqual({
        email: "johndoe@example.com",
        name: "John Doe",
        phone: "923122312",
        rut: "11111111",
        address: "Moneda 101",
        country: "Chile",
        region: "Metropolitana",
        city: "Santiago",
        postal_code: "850000",
        additional_parameters: {
          parameter_1: "example",
          parameter_2: "example",
        },
      });
      return [200, createFixture];
    });

    const response = await subscriptions.clients.create({
      email: "johndoe@example.com",
      name: "John Doe",
      phone: "923122312",
      rut: "11111111",
      address: "Moneda 101",
      country: "Chile",
      region: "Metropolitana",
      city: "Santiago",
      postal_code: "850000",
      additional_parameters: {
        parameter_1: "example",
        parameter_2: "example",
      },
    });

    expect(response).toEqual(createFixture);
    expect(response.update_at).toBeNull();
    expect(response.subcriptions).toBeNull();
  });

  test("get maps active_cards and nested subcriptions fixture", async () => {
    const getFixture = {
      status: "active",
      id: "cl0be4c8e623c167bc8b777",
      rut: "11111111",
      name: "John Doe",
      phone: "923122312",
      email: "johndoe@example.com",
      address: "Moneda 101",
      city: "Santiago",
      region: "Metropolitana",
      country: "Chile",
      postal_code: "850000",
      created_at: "2023-09-29 22:00:00",
      update_at: null,
      active_cards: [
        {
          last_4_digits: "XXXXXXXXXXXX6622",
          identifier: "surec804a8ed60c747cb8839",
          card_type: "Visa",
          register: "2023-07-26 08:00:19",
        },
      ],
      additional_parameters: {
        parameter_1: "example",
        parameter_2: "example",
      },
      subcriptions: {
        id: "su867f07772aa5f5175527",
        created_at: "2023-09-29 19:58:35",
        status: "active",
        amount: "15000",
        plan: [
          {
            id: "pl9697fb170834ad42dd00",
            name: "test plan",
            currency: "CLP",
          },
        ],
        cards: [{ last_4_digits: "XXXXXXXXXXXX6623", card_type: "Visa" }],
        transactions: [
          {
            created_at: "2023-09-30 19:58:35",
            date_payment: "2023-09-30",
            amount: 10000,
            transaction: 204444,
            authorization_code: "1234",
            order: "001",
            description: "descripcion",
            status: "success",
          },
        ],
      },
    };

    mock
      .onGet("/suclient/cl0be4c8e623c167bc8b777")
      .reply(200, getFixture);

    const response = await subscriptions.clients.get(
      "cl0be4c8e623c167bc8b777",
    );

    expect(response).toEqual(getFixture);
    expect(response.active_cards?.[0]?.identifier).toBe(
      "surec804a8ed60c747cb8839",
    );
    expect(response.subcriptions?.id).toBe("su867f07772aa5f5175527");
    expect(response.subcriptions?.plan?.[0]?.currency).toBe("CLP");
  });

  test("delete returns status and id", async () => {
    mock.onDelete("/suclient/cl0be4c8e623c167bc8b777").reply(200, {
      status: "success",
      id: "cl0be4c8e623c167bc8b777",
    });

    const response = await subscriptions.clients.delete(
      "cl0be4c8e623c167bc8b777",
    );

    expect(response).toEqual({
      status: "success",
      id: "cl0be4c8e623c167bc8b777",
    });
  });

  test("update posts partial body", async () => {
    mock.onPut("/suclient/cl0be4c8e623c167bc8b777").reply((config) => {
      const body = JSON.parse(String(config.data)) as Record<string, unknown>;
      expect(body).toEqual({ name: "John Doe Doe", postal_code: "750000" });
      return [
        200,
        {
          status: "active",
          id: "cl0be4c8e623c167bc8b777",
          name: "John Doe Doe",
          postal_code: "750000",
          update_at: "2023-10-2 08:32:52",
        },
      ];
    });

    const response = await subscriptions.clients.update(
      "cl0be4c8e623c167bc8b777",
      { name: "John Doe Doe", postal_code: "750000" },
    );

    expect(response.name).toBe("John Doe Doe");
    expect(response.update_at).toBe("2023-10-2 08:32:52");
  });
});
