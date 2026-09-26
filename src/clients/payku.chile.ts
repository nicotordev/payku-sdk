import type { PaykuCountryCore } from "./payku.country-base";
import { PaykuCountryBase } from "./payku.country-base";
import { PaykuScopedBanks } from "./payku.banks.scoped";
import { PaykuScopedPaymentMethods } from "./payku.payment-methods.scoped";
import type PaykuConciliation from "./payku.conciliation";
import type PaykuConsumptionSubscriptions from "./payku.consumption-subscriptions";
import type PaykuEscrow from "./payku.escrow";
import type PaykuEvents from "./payku.events";
import type PaykuMall from "./payku.mall";
import type PaykuMarketplace from "./payku.marketplace";
import type PaykuNullification from "./payku.nullification";
import type PaykuSubscriptions from "./payku.subscriptions";
import type PaykuWallet from "./payku.wallet";
import { PaykuChileTransactions } from "./payku.transactions.scoped";

/** Cliente tipado para comercios en Chile (CLP). */
export class PaykuChile extends PaykuCountryBase {
  readonly country = "CL" as const;
  readonly currency = "CLP" as const;

  readonly transactions: PaykuChileTransactions;
  readonly wallet: PaykuWallet;
  readonly banks: PaykuScopedBanks;
  readonly paymentMethods: PaykuScopedPaymentMethods;
  readonly subscriptions: PaykuSubscriptions;
  readonly consumptionSubscriptions: PaykuConsumptionSubscriptions;
  readonly marketplace: PaykuMarketplace;
  readonly mall: PaykuMall;
  readonly events: PaykuEvents;
  readonly escrow: PaykuEscrow;
  readonly nullification: PaykuNullification;
  readonly conciliation: PaykuConciliation;

  constructor(core: PaykuCountryCore) {
    super(core);
    this.transactions = new PaykuChileTransactions(
      core.transactions,
      core.defaults,
    );
    this.wallet = core.wallet;
    this.banks = new PaykuScopedBanks(core.banks, "CL");
    this.paymentMethods = new PaykuScopedPaymentMethods(
      core.paymentMethods,
      "CL",
    );
    this.subscriptions = core.subscriptions;
    this.consumptionSubscriptions = core.consumptionSubscriptions;
    this.marketplace = core.marketplace;
    this.mall = core.mall;
    this.events = core.events;
    this.escrow = core.escrow;
    this.nullification = core.nullification;
    this.conciliation = core.conciliation;
  }
}
