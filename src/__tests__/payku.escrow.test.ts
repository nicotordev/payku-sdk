import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import PaykuEscrow from "../clients/payku.escrow";
import { HttpClient } from "../http/client";

const authorizeFixture = {
  transactions: [
    {
      status: "liquidate" as const,
      transaction_id: "trx3b4d77b43acd9a720",
      amount: 15000,
      availability_date: "2021-07-01",
      deposit_date: "2021-07-06",
    },
    {
      status: "pending for deposit" as const,
      transaction_id: "trx3b4d77b43acd9a385",
      amount: 8000,
      availability_date: "2021-07-01",
      deposit_date: "N/D",
    },
  ],
};

describe("PaykuEscrow authorize response", () => {
  let mock: InstanceType<typeof MockAdapter>;
  let apiAxios: ReturnType<typeof axios.create>;
  let escrow: PaykuEscrow;

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

    escrow = new PaykuEscrow(http);
  });

  afterEach(() => {
    mock.restore();
  });

  test("authorize maps transactions settlement fixture", async () => {
    mock.onPost("/escrow").reply(200, authorizeFixture);

    const response = await escrow.authorize({
      transactions: [
        "trx3b4d77b43acd9a720",
        "trx3b4d77b43acd9a385",
      ],
    });

    expect(response).toEqual(authorizeFixture);
    expect(response.transactions[0]?.status).toBe("liquidate");
    expect(response.transactions[1]?.deposit_date).toBe("N/D");
  });
});
