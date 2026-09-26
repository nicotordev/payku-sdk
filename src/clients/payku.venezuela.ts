import type { PaykuCountryCore } from "./payku.country-base";
import { PaykuCountryBase } from "./payku.country-base";
import { PaykuScopedBanks } from "./payku.banks.scoped";
import { PaykuScopedPaymentMethods } from "./payku.payment-methods.scoped";
import { PaykuVenezuelaTransactions } from "./payku.transactions.scoped";
import { PaykuSharedWallet } from "./payku.wallet.scoped";

/** Cliente tipado para comercios en Venezuela (VES). */
export class PaykuVenezuela extends PaykuCountryBase {
  readonly country = "VE" as const;
  readonly currency = "VES" as const;

  readonly transactions: PaykuVenezuelaTransactions;
  readonly wallet: PaykuSharedWallet;
  readonly banks: PaykuScopedBanks;
  readonly paymentMethods: PaykuScopedPaymentMethods;

  constructor(core: PaykuCountryCore) {
    super(core);
    this.transactions = new PaykuVenezuelaTransactions(
      core.transactions,
      core.defaults,
    );
    this.wallet = new PaykuSharedWallet(core.wallet, "VE");
    this.banks = new PaykuScopedBanks(core.banks, "VE");
    this.paymentMethods = new PaykuScopedPaymentMethods(
      core.paymentMethods,
      "VE",
    );
  }
}
