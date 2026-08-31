import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import PaykuEvents from "../clients/payku.events";
import { HttpClient } from "../http/client";
import { buildEventAffiliation } from "../utils/payku.utils";

const createFixture = {
  status: "success",
  id: "98374",
  event: "Event",
  date_event: "2023-12-20",
  date_payment: "2023-12-22",
  date_closing_sales: "2023-12-19 23:59:00",
  url_logo: "https://www.example.com/logo_event1.png",
  url_event: "https://www.example.com/event1",
  distribution: {
    affiliate: "100.00",
    service_sale: "10.00",
  },
  affiliation: [
    {
      id: "b99dfd8193ebfd37d4b9",
      email: "afiliate1@domain.com",
      percent: "100.00",
      status: "pending",
    },
  ],
};

const getFixture = {
  id: "98374",
  event: "Event",
  date_event: "2023-12-20",
  date_payment: "2023-12-22",
  date_closing_sales: "2023-12-19 23:59:00",
  url_logo: "https://www.example.com/logo_event1.png",
  url_event: "https://www.example.com/event1",
  distribution: {
    affiliate: "100.00",
    service_sale: "10.00",
  },
  affiliations: [
    {
      id: "b99dfd8193ebfd37d4b9",
      email: "afiliate1@domain.com",
      percent: "100.00",
      status: "pending",
    },
  ],
};

describe("PaykuEvents", () => {
  let mock: InstanceType<typeof MockAdapter>;
  let apiAxios: ReturnType<typeof axios.create>;
  let events: PaykuEvents;

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

    events = new PaykuEvents(http);
  });

  afterEach(() => {
    mock.restore();
  });

  test("create posts documented event body and maps affiliation (singular) fixture", async () => {
    mock.onPost("/event").reply((config) => {
      const body = JSON.parse(String(config.data)) as Record<string, unknown>;
      expect(body).toEqual({
        event: "98374",
        name: "Event",
        date_event: "2023-12-20",
        date_closing_sales: "2023-12-19 23:59:00",
        date_payment: "2023-12-22",
        url_logo: "https://www.example.com/logo_event1.png",
        url_event: "https://www.example.com/event1",
        service_sale: 10,
        affiliation: [
          ["afiliate1@example.com", 50],
          ["afiliate2@example.com", 50],
        ],
      });
      expect(body).not.toHaveProperty("description");
      return [200, createFixture];
    });

    const response = await events.create({
      event: "98374",
      name: "Event",
      date_event: "2023-12-20",
      date_closing_sales: "2023-12-19 23:59:00",
      date_payment: "2023-12-22",
      url_logo: "https://www.example.com/logo_event1.png",
      url_event: "https://www.example.com/event1",
      service_sale: 10,
      affiliation: buildEventAffiliation([
        { email: "afiliate1@example.com", percent: 50 },
        { email: "afiliate2@example.com", percent: 50 },
      ]),
    });

    expect(response).toEqual(createFixture);
    expect(response.affiliation[0]?.status).toBe("pending");
    expect(response).not.toHaveProperty("affiliations");
  });

  test("get maps affiliations (plural) without top-level status", async () => {
    mock.onGet("/event/98374").reply(200, getFixture);

    const response = await events.get("98374");

    expect(response).toEqual(getFixture);
    expect(response).not.toHaveProperty("status");
    expect(response.affiliations).toHaveLength(1);
    expect(response.distribution.service_sale).toBe("10.00");
  });
});
