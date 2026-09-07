import {
  createPaykuAPIError,
  PaykuConciliationError,
  type PaykuClientOptions,
} from "../errors";
import type { HttpClient } from "../http/client";
import {
  bodyAsRecord,
  validateConciliationRequest,
  type ValidateConciliationOptions,
} from "../utils/payku.utils";
import type {
  PaykuConciliationRequest,
  PaykuListConciliationsResponse,
} from "../types/payku.conciliation";

export default class PaykuConciliation {
  /**
   * Obtiene la lista de conciliaciones bancarias entre fechas (rango máx. 30 días).
   * Endpoint público/privado con autenticación Bearer (sin header Sign).
   */
  public list = this.listConciliations.bind(this);

  /**
   * @deprecated Usar `list()` en su lugar.
   */
  public create = this.listConciliations.bind(this);

  constructor(
    private readonly http: HttpClient,
    private readonly options?: PaykuClientOptions,
  ) {}

  private async listConciliations(
    params: PaykuConciliationRequest,
    options?: ValidateConciliationOptions,
  ): Promise<PaykuListConciliationsResponse> {
    validateConciliationRequest(params, options);

    return this.http
      .request<PaykuListConciliationsResponse>({
        method: "POST",
        path: "/conciliation",
        body: bodyAsRecord(params),
      })
      .catch((error) => {
        throw createPaykuAPIError(
          error,
          "conciliation.list",
          PaykuConciliationError,
          this.options,
        );
      });
  }
}
