import type { PaykuCurrency } from "../types/payku.common";

/** Códigos de método de pago documentados por moneda. */
export const PAYKU_PAYMENT_METHODS = {
  CLP: {
    WEBPAY: 1,
    ETPAY: 4,
    PAGO46: 6,
    MACH: 9,
    FULL: 14,
    KLAP: 18,
    FINTOC: 19,
    TENPO: 23,
    FLOID: 26,
    GRANVE: 30,
    GOOGLE_APPLE_PAY: 31,
    WEBPAY_1_3: 100,
    WEBPAY_4_6: 101,
    WEBPAY_7_12: 102,
    ALL: 99,
  },
  PEN: {
    SAFETY_PAY: 20,
    QR_INTEROPERABLE: 21,
    CARDS: 25,
    LIGOPAY: 28,
    ATIX: 29,
  },
  VES: {
    VEPUY: 17,
    GRANVE: 30,
  },
} as const satisfies Record<PaykuCurrency, Record<string, number>>;

/** Medios CLP que exigen `additional_parameters.payer_rut` al crear transacción. */
export const PAYKU_CLP_PAYMENTS_REQUIRING_PAYER_RUT = [
  PAYKU_PAYMENT_METHODS.CLP.ETPAY,
  PAYKU_PAYMENT_METHODS.CLP.FINTOC,
  PAYKU_PAYMENT_METHODS.CLP.FLOID,
] as const;

/** Gateways On-Site documentados para Venezuela. */
export const PAYKU_VES_GATEWAYS = {
  VZLAVECAP2C: "VZLAVECAP2C",
  BMIGVECAP2C: "BMIGVECAP2C",
  BMIGVECAC2P: "BMIGVECAC2P",
  BAMRVECAC2P: "BAMRVECAC2P",
  UNIOVECAP2C: "UNIOVECAP2C",
  VZLAVECABIO: "VZLAVECABIO",
} as const;

/** Tipos de cuenta bancaria documentados. */
export const PAYKU_BANK_ACCOUNT_TYPES = {
  CHECKING: "1",
  VIEW: "2",
  SAVINGS: "3",
} as const;
