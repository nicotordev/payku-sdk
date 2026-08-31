import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import PaykuMall from "../clients/payku.mall";
import { HttpClient } from "../http/client";
import { PaykuAPIError } from "../errors";

const createFixture = {
  status: "success" as const,
  id: "malld200058ab44739ddee2adcd2f5",
  individual_orders: [
    {
      merchant: "81b6179e4feeef2b50af71d660f830de",
      amount: 30000,
      subject: "item1",
      event: null,
      identificador: "9917068816213146",
      individual_order: "9654",
    },
    {
      merchant: "81b6179e4feeef2b50af71d66f7830de",
      amount: 25000,
      subject: "item2",
      event: null,
      identificador: "9917068816213146",
      individual_order: "9654",
    },
  ],
  url: "https://des.payku.cl/gateway/mall/malld200058ab44739ddee2adcd2f5",
};

const getFixture = {
  status: "success" as const,
  id: "malld200058ab44739ddee2adcd2f5",
  created_at: "2023-10-16 11:23:19",
  amount: "30000",
  payment: {
    media: "Webpay",
    verification_key: "d60aaa661ea74d824373806c8aa38137",
    authorization_code: "441864",
    last_4_digits: "5135",
    card_type: "",
    currency: "CLP",
  },
  merchant: [
    { name: "John Doe", amount: 30000, subject: "item1" },
    { name: "Jane Doe", amount: 25000, subject: "item2" },
    { name: "Enteprise", amount: 15000, subject: "item3" },
  ],
};

describe("PaykuMall responses", () => {
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

  test("create maps individual_orders fixture", async () => {
    mock.onPost("/mall").reply(200, createFixture);

    const response = await mall.create({
      email: "joedoe@example.com",
      payment: 1,
      merchant: [
        ["81b6179e4feeef2b50af71d660f830de", "30000", "item1", null, "4545"],
      ],
      order: 123,
      urlreturn: "https://youwebsite.com/urlreturn",
    });

    expect(response).toEqual(createFixture);
    expect(response.individual_orders[0]?.event).toBeNull();
    expect(response.url).toContain("/gateway/mall/");
  });

  test("get maps merchant and payment fixture", async () => {
    mock.onGet("/mall/malld200058ab44739ddee2adcd2f5").reply(200, getFixture);

    const response = await mall.get("malld200058ab44739ddee2adcd2f5");

    expect(response).toEqual(getFixture);
    expect(response.payment.media).toBe("Webpay");
    expect(response.merchant).toHaveLength(3);
  });

  test("get throws PaykuAPIError on 404 business failure", async () => {
    mock.onGet("/mall/missing").reply(200, {
      status: "failed",
      type: "Not Found",
      message_error: "id:it is not valid",
    });

    expect(mall.get("missing")).rejects.toBeInstanceOf(PaykuAPIError);
  });
});
