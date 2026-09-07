import { z } from "zod";
import { PAYKU_MALL_PAYMENT_CODES } from "../constants/payku.constants";

/**
 * Tupla de afiliado para eventos: [email, percent]
 */
export const PaykuEventAffiliationTupleSchema = z.tuple([
  z.string().min(1, "affiliation email is required"),
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
    event: z.string().min(1, "event is required"),
    name: z.string().min(1, "name is required"),
    date_event: z.string().min(1, "date_event is required"),
    date_closing_sales: z.string().min(1, "date_closing_sales is required"),
    date_payment: z.string().min(1, "date_payment is required"),
    url_event: z.string().optional(),
    url_logo: z.string().optional(),
    service_sale: z.number().optional(),
    affiliation: z.array(PaykuEventAffiliationTupleSchema).optional(),
  })
  .passthrough();

export type PaykuCreateEvent = z.infer<typeof PaykuCreateEventSchema>;

/**
 * Tupla wire de un beneficiario Mall de 5 elementos:
 * [tokenOrAffiliationId, amount, subject, eventId, individualOrder]
 */
export const PaykuMallMerchantTupleSchema = z.tuple([
  z.string().min(1, "tokenOrAffiliationId is required"),
  z
    .union([
      z.number(),
      z.string().refine((s) => Number.isFinite(Number(s)), "amount must be finite"),
    ])
    .refine(
      (val) => {
        const num = Number(val);
        return Number.isFinite(num) && num > 0;
      },
      "merchant amount must be greater than 0",
    ),
  z.string().min(1, "subject is required"),
  z.string().nullable().optional(),
  z.string().min(1, "individualOrder is required"),
]);

export type PaykuMallMerchantTuple = z.infer<typeof PaykuMallMerchantTupleSchema>;

/**
 * Esquema Zod para crear transacciones Mall multi-comercio (`POST /api/mall`).
 */
export const PaykuCreateMallTransactionSchema = z
  .object({
    email: z.string().min(1, "email is required"),
    payment: z
      .number()
      .refine(
        (code) => (PAYKU_MALL_PAYMENT_CODES as readonly number[]).includes(code),
        (code) => ({ message: `payment code ${code} is invalid for Mall` }),
      ),
    merchant: z
      .array(PaykuMallMerchantTupleSchema)
      .min(1, "merchant must be a non-empty array"),
    order: z.union([z.string().min(1, "order is required"), z.number()]),
    urlreturn: z.string().min(1, "urlreturn is required"),
    urlnotify: z.string().optional(),
  })
  .passthrough();

export type PaykuCreateMallTransaction = z.infer<
  typeof PaykuCreateMallTransactionSchema
>;

/**
 * Par de afiliación para Marketplace: [clientId, percentage]
 */
export const PaykuMarketplaceAffiliationPairSchema = z.tuple([
  z.string().min(1, "clientId must be a non-empty string"),
  z
    .union([z.string(), z.number().transform(String)])
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
    name: z.string().min(1, "name is required"),
    percentage: z
      .union([z.string(), z.number().transform(String)])
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
    const clients = data.affiliation.reduce((sum, [, pct]) => sum + Number(pct), 0);
    const total = merchant + clients;
    const tolerance = 0.01 + Number.EPSILON * Math.max(1, Math.abs(total), 100);

    if (!Number.isFinite(total) || Math.abs(total - 100) > tolerance) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `marketplace affiliation percentages must sum to 100 (got ${total})`,
        path: ["affiliation"],
      });
    }
  });

export type PaykuMarketplaceAffiliation = z.infer<
  typeof PaykuMarketplaceAffiliationSchema
>;
