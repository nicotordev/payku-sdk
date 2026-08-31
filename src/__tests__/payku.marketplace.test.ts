import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import PaykuMarketplace from "../clients/payku.marketplace";
import { HttpClient } from "../http/client";
import {
  buildMarketplaceAffiliation,
  validateMarketplaceAffiliationPercentages,
} from "../utils/payku.utils";
import { PaykuError } from "../errors";

const affiliationFixture = {
  id: "sucaab7865dceaff49d8b3",
  status: "register",
  name: "name",
  token: "eecd92fdbb8bf615e8215d6fbb30bb6ae6f82c9e1810f85b65bbeb472794c4a4",
  percentage: "20.00",
  affiliations: [
    {
      id: "ma9fd16221a9645b0036",
      name: "name",
      percentage: "80.00",
    },
  ],
};

describe("marketplace affiliation helpers", () => {
  test("buildMarketplaceAffiliation builds wire pairs", () => {
    expect(
      buildMarketplaceAffiliation([
        { clientId: "ma9fd16221a9645b0036", percentage: 80 },
      ]),
    ).toEqual([["ma9fd16221a9645b0036", "80"]]);
  });

  test("validateMarketplaceAffiliationPercentages accepts 100", () => {
    expect(() =>
      validateMarketplaceAffiliationPercentages("20", [
        ["ma9fd16221a9645b0036", "80"],
      ]),
    ).not.toThrow();
  });

  test("validateMarketplaceAffiliationPercentages rejects non-100", () => {
    expect(() =>
      validateMarketplaceAffiliationPercentages("20", [
        ["ma9fd16221a9645b0036", "70"],
      ]),
    ).toThrow(PaykuError);
  });
});

describe("PaykuMarketplace maaffiliation", () => {
  let mock: InstanceType<typeof MockAdapter>;
  let apiAxios: ReturnType<typeof axios.create>;
  let marketplace: PaykuMarketplace;

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

    marketplace = new PaykuMarketplace(http);
  });

  afterEach(() => {
    mock.restore();
  });

  test("create posts name/percentage/affiliation and maps fixture", async () => {
    mock.onPost("/maaffiliation").reply((config) => {
      const body = JSON.parse(String(config.data)) as Record<string, unknown>;
      expect(body).toEqual({
        name: "name",
        percentage: "20",
        affiliation: [["ma9fd16221a9645b0036", "80"]],
      });
      expect(body).not.toHaveProperty("client");
      return [200, affiliationFixture];
    });

    const response = await marketplace.affiliations.create({
      name: "name",
      percentage: "20",
      affiliation: [["ma9fd16221a9645b0036", "80"]],
    });

    expect(response).toEqual(affiliationFixture);
    expect(response.token).toBeTruthy();
  });

  test("delete returns suspended status and id", async () => {
    mock.onDelete("/maaffiliation/sucaab7865dceaff49d8b3").reply(200, {
      status: "suspended",
      id: "maab4462d6133e05e518",
    });

    const response = await marketplace.affiliations.delete(
      "sucaab7865dceaff49d8b3",
    );

    expect(response).toEqual({
      status: "suspended",
      id: "maab4462d6133e05e518",
    });
  });
});
