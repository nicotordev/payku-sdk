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

    mock.onGet("/suclient/cl0be4c8e623c167bc8b777").reply(200, getFixture);

    const response = await subscriptions.clients.get("cl0be4c8e623c167bc8b777");

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

describe("PaykuSubscriptions sususcription", () => {
  let mock: InstanceType<typeof MockAdapter>;
  let apiAxios: ReturnType<typeof axios.create>;
  let subscriptions: PaykuSubscriptions;

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
    subscriptions = new PaykuSubscriptions(http);
  });

  afterEach(() => {
    mock.restore();
  });

  test("create maps register url fixture", async () => {
    mock.onPost("/sususcription").reply(200, {
      status: "register",
      id: "sucaab7865dceaff49d8b3",
      url: "http://des.payku.cl/gateway/registrosuscripcion",
    });

    const response = await subscriptions.subscriptions.create({
      plan: "pl9697fb170834ad42dd00",
      client: "cl9b1e1dd988694f30fa30",
    });

    expect(response.status).toBe("register");
    expect(response.url).toContain("registrosuscripcion");
  });

  test("get maps nested client/plan/active_cards", async () => {
    mock.onGet("/sususcription/suc1").reply(200, {
      id: "suc1",
      status: "active",
      start: "2019-07-22 18:34:49",
      end: "2023-06-12 00:00:00",
      client: {
        id: "cld1",
        name: "name",
        email: "joedoe@example.com",
      },
      plan: { id: "pl1", name: "test plan", currency: "CLP" },
      active_cards: [
        {
          last_4_digits: "6622",
          identifier: "sure1",
          card_type: "Visa",
          register: "2023-07-26 08:00:19",
        },
      ],
      transactions: [],
      logs: { status: [] },
    });

    const response = await subscriptions.subscriptions.get("suc1");
    expect(response.status).toBe("active");
    expect(response.client.email).toBe("joedoe@example.com");
    expect(response.active_cards?.[0]?.identifier).toBe("sure1");
  });

  test("list forwards page query and maps envelope", async () => {
    mock.onGet("/sususcription").reply((config) => {
      expect(config.params).toEqual({ page: 1, per_page: 100 });
      return [
        200,
        [
          {
            subscriptions: [
              {
                id: "suc1",
                status: "active",
                client: { id: "c1", name: "n", email: "a@b.com" },
                plan: { id: "p1", name: "plan", currency: "CLP" },
              },
            ],
          },
        ],
      ];
    });

    const response = await subscriptions.subscriptions.list({
      page: 1,
      per_page: 100,
    });
    expect(response[0]?.subscriptions[0]?.id).toBe("suc1");
  });

  test("listV3 maps estatus and paid", async () => {
    mock.onGet("/sususcriptionv3").reply((config) => {
      expect(config.params).toEqual({
        date_init: "2021-09-01",
        date_end: "2021-09-15",
        active: true,
      });
      return [
        200,
        [
          {
            subscriptions: [
              {
                id: "suc1",
                estatus: "active",
                client: { id: "c1", name: "n", email: "a@b.com" },
                plan: { id: "p1", name: "plan", currency: "CLP" },
                paid: [{ status: "success", amount_paid: 2500 }],
              },
            ],
          },
        ],
      ];
    });

    const response = await subscriptions.subscriptions.listV3({
      date_init: "2021-09-01",
      date_end: "2021-09-15",
      active: true,
    });
    expect(response[0]?.subscriptions[0]?.estatus).toBe("active");
    expect(response[0]?.subscriptions[0]?.paid?.[0]?.amount_paid).toBe(2500);
  });

  test("delete returns id and status", async () => {
    mock.onDelete("/sususcription/suc1").reply(200, {
      id: "suc1",
      status: "success",
    });
    const response = await subscriptions.subscriptions.delete("suc1");
    expect(response).toEqual({ id: "suc1", status: "success" });
  });
});

describe("PaykuSubscriptions plans", () => {
  let mock: InstanceType<typeof MockAdapter>;
  let apiAxios: ReturnType<typeof axios.create>;
  let subscriptions: PaykuSubscriptions;

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
    subscriptions = new PaykuSubscriptions(http);
  });

  afterEach(() => {
    mock.restore();
  });

  test("get maps plans object", async () => {
    mock.onGet("/suplan/pl1").reply(200, {
      status: "success",
      plans: {
        id: "pl1",
        status: "active",
        name: "Test plan",
        code: "001",
        description: "Test Plan",
        url_notify_payment: "",
        url_notify_suscription: "",
        total_suscription: 0,
        total_suscription_active: 0,
      },
    });

    const response = await subscriptions.plans.get("pl1");
    expect(response.plans.id).toBe("pl1");
    expect(response.plans.url_notify_suscription).toBe("");
  });

  test("list maps plans array", async () => {
    mock.onGet("/suplan/plans").reply(200, {
      status: "success",
      plans: [
        {
          id: "pl1",
          status: "active",
          name: "Test plan",
          code: "001",
          description: "Test Plan",
          url_notify_payment: "",
          url_notify_suscription: "",
          total_suscription: 0,
          total_suscription_active: 0,
        },
      ],
    });

    const response = await subscriptions.plans.list();
    expect(Array.isArray(response.plans)).toBe(true);
    expect(response.plans[0]?.name).toBe("Test plan");
  });
});
