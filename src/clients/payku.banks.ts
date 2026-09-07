import type { HttpClient } from "../http/client";
import type {
  PaykuBank,
  PaykuListBanksParams,
  PaykuBanksResponse,
} from "../types/payku.banks";

/**
 * Módulo de consulta de catálogo de bancos.
 *
 * `GET /api/banks` es un endpoint de catálogo público según la especificación de Payku.
 * No requiere autenticación Bearer ni firma HMAC Sign.
 */
export default class PaykuBanks {
  constructor(private readonly http: HttpClient) {}

  public list = this.listBanks.bind(this);

  /**
   * Lista los bancos disponibles según la moneda especificada.
   *
   * @param params Parámetros de consulta (`currency`).
   * @returns Lista de entidades `PaykuBank` (o arreglo vacío defensivo si la API omite `banks`).
   */
  private async listBanks(params: PaykuListBanksParams): Promise<PaykuBank[]> {
    const response = await this.http.request<PaykuBanksResponse>({
      method: "GET",
      path: "/banks",
      auth: false,
      query: { currency: String(params.currency).toLowerCase() },
    });

    return Array.isArray(response?.banks) ? response.banks : [];
  }
}

