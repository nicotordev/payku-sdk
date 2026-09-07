import { z } from "zod";
import { PAYKU_MALL_PAYMENT_CODES } from "../constants/payku.constants";

const requireNonEmptyString = (field: string) =>
  z
    .string({ required_error: `${field} is required` })
    .refine((val) => val.trim().length > 0, {
      message: `${field} is required`,
    });

/**
 * Tupla de afiliado para eventos: [email, percent]
 */
export const PaykuEventAffiliationTupleSchema = z.tuple([
  z
    .string({ required_error: "affiliation email is required" })
    .trim()
    .email("affiliation email must be a valid email address"),
  z
    .union([z.number(), z.string().transform((v) => Number(v))])
    .refine(
      (v) => Number.isFinite(v) && v > 0 && v <= 100,
      "affiliation percent must be a finite number between 0 and 100",
    ),
]);

export type PaykuEventAffiliationTuple = z.infer<
  typeof PaykuEventAffiliationTupleSchema
>;

/**
 * Esquema Zod para crear eventos (`POST /api/event`).
 */
export const PaykuCreateEventSchema = z
  .object({
    event: requireNonEmptyString("event"),
    name: requireNonEmptyString("name"),
    date_event: requireNonEmptyString("date_event"),
    date_closing_sales: requireNonEmptyString("date_closing_sales"),
    date_payment: requireNonEmptyString("date_payment"),
    url_event: z.string().optional(),
    url_logo: z.string().optional(),
    service_sale: z.number().optional(),
    affiliation: z.array(PaykuEventAffiliationTupleSchema).optional(),
  })
  .passthrough();

export type PaykuCreateEventRequestInput = z.infer<
  typeof PaykuCreateEventSchema
>;
export type PaykuCreateEventInput = PaykuCreateEventRequestInput;
export type PaykuCreateEvent = PaykuCreateEventRequestInput;

/**
 * Tupla wire de un beneficiario Mall de 5 elementos:
 * [tokenOrAffiliationId, amount, subject, eventId, individualOrder]
 */
export const PaykuMallMerchantTupleSchema = z.tuple([
  requireNonEmptyString("tokenOrAffiliationId"),
  z
    .union([
      z.number(),
      z.string().refine(
        (s) => s.trim().length > 0 && Number.isFinite(Number(s)),
        "amount must be finite",
      ),
    ])
    .refine(
      (val) => {
        const num = Number(val);
        return Number.isFinite(num) && num > 0;
      },
      "merchant amount must be greater than 0",
    ),
  requireNonEmptyString("subject"),
  z.string().nullable().optional(),
  requireNonEmptyString("individualOrder"),
]);

export type PaykuMallMerchantTuple = z.infer<
  typeof PaykuMallMerchantTupleSchema
>;

/**
 * Esquema Zod para crear transacciones Mall multi-comercio (`POST /api/mall`).
 */
export const PaykuCreateMallTransactionSchema = z
  .object({
    email: requireNonEmptyString("email"),
    payment: z
      .number()
      .refine(
        (code) => (PAYKU_MALL_PAYMENT_CODES as readonly number[]).includes(code),
        (code) => ({ message: `payment code ${code} is invalid for Mall` }),
      ),
    merchant: z
      .array(PaykuMallMerchantTupleSchema)
      .min(1, "merchant must be a non-empty array"),
    order: z.union([
      requireNonEmptyString("order"),
      z.number(),
    ]),
    urlreturn: requireNonEmptyString("urlreturn"),
    urlnotify: z.string().optional(),
  })
  .passthrough();

export type PaykuCreateMallTransactionRequestInput = z.infer<
  typeof PaykuCreateMallTransactionSchema
>;
export type PaykuCreateMallTransactionInput =
  PaykuCreateMallTransactionRequestInput;
export type PaykuCreateMallTransaction =
  PaykuCreateMallTransactionRequestInput;

/**
 * Par de afiliación para Marketplace: [clientId, percentage]
 */
export const PaykuMarketplaceAffiliationPairSchema = z.tuple([
  z
    .string({ required_error: "clientId must be a non-empty string" })
    .refine((s) => s.trim().length > 0, "clientId must be a non-empty string"),
  z
    .union([
      z.number(),
      z
        .string()
        .refine(
          (s) => s.trim().length > 0,
          "percentage is required",
        ),
    ])
    .transform((val) => String(val))
    .refine((val) => {
      const num = Number(val);
      return Number.isFinite(num) && num > 0 && num <= 100;
    }, "percentage must be a finite number between 0 and 100"),
]);

export type PaykuMarketplaceAffiliationPair = z.infer<
  typeof PaykuMarketplaceAffiliationPairSchema
>;

/**
 * Esquema Zod para crear afiliación de Marketplace (`POST /api/maaffiliation`).
 * Valida que los porcentajes sumen 100 (con tolerancia 0.01 y Number.EPSILON).
 */
export const PaykuMarketplaceAffiliationSchema = z
  .object({
    name: requireNonEmptyString("name"),
    percentage: z
      .union([
        z.number(),
        z
          .string()
          .refine(
            (s) => s.trim().length > 0,
            "percentage is required",
          ),
      ])
      .transform((val) => String(val))
      .refine((val) => {
        const num = Number(val);
        return Number.isFinite(num) && num >= 0 && num <= 100;
      }, "merchant percentage must be a finite number between 0 and 100"),
    affiliation: z
      .array(PaykuMarketplaceAffiliationPairSchema)
      .min(1, "affiliation must be a non-empty array"),
  })
  .passthrough()
  .superRefine((data, ctx) => {
    const merchant = Number(data.percentage);
    const clients = data.affiliation.reduce(
      (sum, [, pct]) => sum + Number(pct),
      0,
    );
    const total = merchant + clients;
    const tolerance =
      0.01 + Number.EPSILON * Math.max(1, Math.abs(total), 100);

    if (!Number.isFinite(total) || Math.abs(total - 100) > tolerance) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `marketplace affiliation percentages must sum to 100 (got ${total})`,
        path: ["affiliation"],
      });
    }
  });

export type PaykuMarketplaceAffiliationRequestInput = z.infer<
  typeof PaykuMarketplaceAffiliationSchema
>;
export type PaykuMarketplaceAffiliationInput =
  PaykuMarketplaceAffiliationRequestInput;
export type PaykuMarketplaceAffiliation =
  PaykuMarketplaceAffiliationRequestInput;
