import { PaykuUnsupportedFeatureError } from "../errors";
import type { PaykuCountry } from "../types/payku.common";
import type PaykuWallet from "./payku.wallet";

/**
 * Wallet compartido (CL/PE/VE) sin withdraw — withdraw es solo Chile.
 */
export class PaykuSharedWallet {
  readonly payouts: PaykuWallet["payouts"];
  readonly balance: PaykuWallet["balance"];
  readonly movements: PaykuWallet["movements"];

  constructor(
    wallet: PaykuWallet,
    private readonly country: PaykuCountry,
  ) {
    this.payouts = wallet.payouts;
    this.balance = wallet.balance;
    this.movements = wallet.movements;
  }

  get withdraw(): never {
    throw new PaykuUnsupportedFeatureError("wallet.withdraw", this.country);
  }
}
