import type { PaykuCountryCore } from "./payku.country-base";
import { PaykuCountryBase } from "./payku.country-base";
import { PaykuScopedBanks } from "./payku.banks.scoped";
import { PaykuScopedPaymentMethods } from "./payku.payment-methods.scoped";
import { PaykuScopedTransactions } from "./payku.transactions.scoped";
import { PaykuSharedWallet } from "./payku.wallet.scoped";

/** Cliente tipado para comercios en Perú (PEN). */
export class PaykuPeru extends PaykuCountryBase {
  readonly country = "PE" as const;
  readonly currency = "PEN" as const;

  readonly transactions: PaykuScopedTransactions;
  readonly wallet: PaykuSharedWallet;
  readonly banks: PaykuScopedBanks;
  readonly paymentMethods: PaykuScopedPaymentMethods;

  constructor(core: PaykuCountryCore) {
    super(core);
    this.transactions = new PaykuScopedTransactions(
      core.transactions,
      "PE",
      core.defaults,
    );
    this.wallet = new PaykuSharedWallet(core.wallet, "PE");
    this.banks = new PaykuScopedBanks(core.banks, "PE");
    this.paymentMethods = new PaykuScopedPaymentMethods(
      core.paymentMethods,
      "PE",
    );
  }
}
