import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import PaykuMall from "../clients/payku.mall";
import { HttpClient } from "../http/client";
import { buildMallMerchant } from "../utils/payku.utils";

describe("PaykuMall create request", () => {
  let mock: InstanceType<typeof MockAdapter>;
  let apiAxios: ReturnType<typeof axios.create>;
  let mall: PaykuMall;

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

    mall = new PaykuMall(http);
  });

  afterEach(() => {
    mock.restore();
  });

  test("create posts documented mall body with merchant tuples", async () => {
    mock.onPost("/mall").reply((config) => {
      expect(config.headers?.Authorization).toBe("Bearer public-token");
      expect(config.headers?.Sign).toMatch(/^[a-f0-9]{64}$/);

      const body = JSON.parse(String(config.data)) as Record<string, unknown>;
      expect(body).toEqual({
        email: "joedoe@example.com",
        payment: 1,
        merchant: [
          [
            "81b6179e4feeef2b50af71d660f830de",
            "30000",
            "item1",
            null,
            "4545",
          ],
          [
            "bcf6c06c523d9394be41bc0174c43d1476f274abb342955aac93cc8014737b3b",
            "25000",
            "item2",
            null,
            "4546",
          ],
        ],
        order: 123,
        urlreturn: "https://youwebsite.com/urlreturn",
        urlnotify: "https://youwebsite.com/urlnotify",
      });

      return [
        200,
        {
          status: "success",
          id: "malld200058ab44739ddee2adcd2f5",
          url: "https://des.payku.cl/gateway/mall/malld200058ab44739ddee2adcd2f5",
        },
      ];
    });

    const response = await mall.create({
      email: "joedoe@example.com",
      payment: 1,
      merchant: [
        buildMallMerchant({
          tokenOrAffiliationId: "81b6179e4feeef2b50af71d660f830de",
          amount: "30000",
          subject: "item1",
          individualOrder: "4545",
        }),
        [
          "bcf6c06c523d9394be41bc0174c43d1476f274abb342955aac93cc8014737b3b",
          "25000",
          "item2",
          null,
          "4546",
        ],
      ],
      order: 123,
      urlreturn: "https://youwebsite.com/urlreturn",
      urlnotify: "https://youwebsite.com/urlnotify",
    });

    expect(response.id).toBe("malld200058ab44739ddee2adcd2f5");
  });
});
