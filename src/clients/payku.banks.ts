import type { HttpClient } from "../http/client";
import type {
  PaykuBank,
  PaykuListBanksParams,
  PaykuBanksResponse,
} from "../types/payku.banks";

export default class PaykuBanks {
  constructor(private readonly http: HttpClient) {}

  public list = this.listBanks.bind(this);

  private async listBanks(params: PaykuListBanksParams): Promise<PaykuBank[]> {
    const response = await this.http.request<PaykuBanksResponse>({
      method: "GET",
      path: "/banks",
      query: { currency: String(params.currency).toLowerCase() },
    });

    return response.banks;
  }
}
