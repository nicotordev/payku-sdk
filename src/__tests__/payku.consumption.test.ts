import { URL } from "node:url";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import Payku from "../clients/payku";
import PaykuConsumptionSubscriptions from "../clients/payku.consumption-subscriptions";
import { PaykuError } from "../errors";
import { HttpClient } from "../http/client";
import { buildSign } from "../http/sign";
import { buildConsumptionGatewayUrl } from "../utils/payku.utils";

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

  test("plans.create maps urlNotifySubscription onto url_notify_suscription and signs it", async () => {
    const wire = {
      name: "Delivery",
      url_notify_suscription: "https://tu-sitio.com/notify-suscription",
      url_notify_payment: "https://tu-sitio.com/notify-payment",
    };

    mock.onPost("/suplan/").reply((config) => {
      expect(config.headers?.Sign).toBe(
        buildSign("/api/suplan/", wire, "private-token"),
      );
      expect(JSON.parse(String(config.data))).toEqual(wire);
      return [200, { status: "success", id: "pl4293e97a87195bb9edcd" }];
    });

    await consumption.plans.create({
      name: "Delivery",
      urlNotifySubscription: "https://tu-sitio.com/notify-suscription",
      url_notify_payment: "https://tu-sitio.com/notify-payment",
    });
  });

  test("plans.create rejects conflicting notify aliases", async () => {
    await expect(
      consumption.plans.create({
        name: "Delivery",
        url_notify_suscription: "https://tu-sitio.com/a",
        url_notify_subscription: "https://tu-sitio.com/b",
      }),
    ).rejects.toThrow(
      "urlNotifySubscription conflicts with url_notify_suscription",
    );
    expect(mock.history.post.length).toBe(0);
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
      subscription: "sucaab7865dceaff49d8b3",
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

const gatewayFixture = {
  rootUrl: "https://des.payku.cl",
  planId: 607,
  verif: "b4280f5e",
  firstName: "vicente",
  lastName: "borjas",
  email: "example@example.com",
  phone: "986523565",
} as const;

describe("buildConsumptionGatewayUrl", () => {
  test("builds suscripcion/index query in docs order with encoded email", () => {
    const url = buildConsumptionGatewayUrl(gatewayFixture);

    expect(url).toBe(
      "https://des.payku.cl/suscripcion/index?idplan=607&verif=b4280f5e&nombre=vicente&apellido=borjas&email=example%40example.com&telefono=986523565&direct_full=true",
    );
  });

  test("defaults direct_full to true and accepts production rootUrl with trailing slash", () => {
    const url = buildConsumptionGatewayUrl({
      ...gatewayFixture,
      rootUrl: "https://app.payku.cl/",
    });

    expect(url.startsWith("https://app.payku.cl/suscripcion/index?")).toBe(
      true,
    );
    expect(url).toContain("direct_full=true");
  });

  test("collapses repeated trailing slashes on rootUrl without regex", () => {
    const url = buildConsumptionGatewayUrl({
      ...gatewayFixture,
      rootUrl: "https://des.payku.cl///",
    });

    expect(url.startsWith("https://des.payku.cl/suscripcion/index?")).toBe(
      true,
    );
  });

  test("sets direct_full=false when directFull is false", () => {
    const url = buildConsumptionGatewayUrl({
      ...gatewayFixture,
      directFull: false,
    });

    expect(url).toContain("direct_full=false");
    expect(url).not.toContain("direct_full=true");
  });

  test("appends extra query params without overriding reserved keys", () => {
    const url = buildConsumptionGatewayUrl({
      ...gatewayFixture,
      extra: {
        rut: "11111111-1",
        idplan: "999",
        verif: "forged",
      },
    });

    const parsed = new URL(url);
    expect(parsed.searchParams.get("idplan")).toBe("607");
    expect(parsed.searchParams.get("verif")).toBe("b4280f5e");
    expect(parsed.searchParams.get("rut")).toBe("11111111-1");
  });

  test("rejects missing required fields", () => {
    expect(() =>
      buildConsumptionGatewayUrl({
        ...gatewayFixture,
        email: "  ",
      }),
    ).toThrow(PaykuError);

    expect(() =>
      buildConsumptionGatewayUrl({
        ...gatewayFixture,
        rootUrl: "",
      }),
    ).toThrow("rootUrl is required");
  });

  test("rejects invalid rootUrl", () => {
    expect(() =>
      buildConsumptionGatewayUrl({
        ...gatewayFixture,
        rootUrl: "not-a-url",
      }),
    ).toThrow("rootUrl is not a valid URL");
  });
});

const gatewayClientParams = {
  planId: gatewayFixture.planId,
  verif: gatewayFixture.verif,
  firstName: gatewayFixture.firstName,
  lastName: gatewayFixture.lastName,
  email: gatewayFixture.email,
  phone: gatewayFixture.phone,
};

function consumptionWithRoot(rootUrl: string): PaykuConsumptionSubscriptions {
  return new PaykuConsumptionSubscriptions(
    new HttpClient({
      baseUrl: "https://des.payku.cl/api",
      rootUrl,
      publicToken: "public-token",
      privateToken: "private-token",
    }),
  );
}

describe("consumptionSubscriptions.gatewayUrl", () => {
  test("uses the sandbox rootUrl from the client", () => {
    const client = consumptionWithRoot("https://des.payku.cl");
    const url = client.gatewayUrl(gatewayClientParams);

    expect(url).toBe(buildConsumptionGatewayUrl(gatewayFixture));
    expect(client.buildGatewayUrl(gatewayClientParams)).toBe(url);
  });

  test("uses the production rootUrl and collapses a trailing slash", () => {
    const url = consumptionWithRoot("https://app.payku.cl/").gatewayUrl(
      gatewayClientParams,
    );

    expect(url.startsWith("https://app.payku.cl/suscripcion/index?")).toBe(
      true,
    );
    expect(url).toContain("direct_full=true");
    expect(url).not.toContain("app.payku.cl//");
  });

  test("collapses repeated trailing slashes on the client rootUrl", () => {
    const url = consumptionWithRoot("https://des.payku.cl///").gatewayUrl(
      gatewayClientParams,
    );

    expect(url.startsWith("https://des.payku.cl/suscripcion/index?")).toBe(
      true,
    );
  });

  test("appends extra query params without overriding reserved keys", () => {
    const url = consumptionWithRoot("https://des.payku.cl").gatewayUrl({
      ...gatewayClientParams,
      extra: {
        rut: "11111111-1",
        idplan: "999",
        verif: "forged",
      },
    });

    const parsed = new URL(url);
    expect(parsed.searchParams.get("idplan")).toBe("607");
    expect(parsed.searchParams.get("verif")).toBe("b4280f5e");
    expect(parsed.searchParams.get("rut")).toBe("11111111-1");
  });

  test("Payku.forCountry CL exposes gatewayUrl with the country host", () => {
    const config = {
      publicToken: "public-token",
      privateToken: "private-token",
    } as const;

    const sandbox = Payku.forCountry("CL", {
      ...config,
      environment: "sandbox",
    }).consumptionSubscriptions.gatewayUrl(gatewayClientParams);
    const production = Payku.forCountry("CL", {
      ...config,
      environment: "production",
    }).consumptionSubscriptions.gatewayUrl(gatewayClientParams);

    expect(sandbox.startsWith("https://des.payku.cl/suscripcion/index?")).toBe(
      true,
    );
    expect(
      production.startsWith("https://app.payku.cl/suscripcion/index?"),
    ).toBe(true);
  });

  test("rejects missing required fields before any request", () => {
    expect(() =>
      consumptionWithRoot("https://des.payku.cl").gatewayUrl({
        ...gatewayClientParams,
        email: "  ",
      }),
    ).toThrow(PaykuError);
  });
});
