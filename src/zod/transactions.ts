import { z } from "zod";
import {
  PAYKU_CLP_CREATE_PAYMENT_CODES,
  PAYKU_CLP_PAYMENTS_REQUIRING_PAYER_RUT,
  PAYKU_LIST_TRANSACTIONS_MAX_PER_PAGE,
  PAYKU_PAYMENT_METHODS,
  PAYKU_VES_GATEWAYS,
} from "../constants/payku.constants";
import type { PaykuCurrency } from "../types/payku.common";
import {
  parsePaykuExpiredInSantiago,
  type ClpPaymentCodeSet,
  type ValidateCreateTransactionOptions,
} from "../utils/payku.utils";

const PAYKU_EXPIRED_FORMAT = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
const PAYKU_EXPIRED_MIN_MARGIN_MS = 5 * 60 * 1000;

function resolveClpPaymentCodes(
  set: ClpPaymentCodeSet = "catalog",
): readonly number[] {
  if (set === "create-docs") {
    return PAYKU_CLP_CREATE_PAYMENT_CODES;
  }
  return Object.values(PAYKU_PAYMENT_METHODS.CLP);
}

const requireNonEmptyString = (field: string) =>
  z
    .string({ required_error: `${field} is required` })
    .refine((val) => val.trim().length > 0, {
      message: `${field} is required`,
    });

/**
 * Esquema para parámetros adicionales de transacción.
 */
export const PaykuTransactionAdditionalParametersSchema = z
  .object({
    parameters1: z.string().optional(),
    parameters2: z.string().optional(),
    order_ext: z.string().optional(),
    payer_rut: z.string().optional(),
    payer_bank: z.string().optional(),
    gateway: z.string().optional(),
  })
  .passthrough();

/**
 * Fábrica para construir PaykuCreateTransactionSchema con opciones de reloj o set de medios.
 */
export function createTransactionSchema(
  options: ValidateCreateTransactionOptions = {},
) {
  return z
    .object({
      email: z.string().optional(),
      order: z.string().optional(),
      subject: z.string().optional(),
      amount: z.number().positive("amount must be greater than 0"),
      currency: z.enum(["CLP", "PEN", "VES"]),
      payment: z.number().int().optional(),
      expired: z.string().optional(),
      urlreturn: z.string().optional(),
      urlnotify: z.string().optional(),
      additional_parameters:
        PaykuTransactionAdditionalParametersSchema.optional(),
    })
    .passthrough()
    .superRefine((data, ctx) => {
      // 1. Validación de expired
      if (data.expired !== undefined) {
        if (data.urlreturn === undefined || data.urlreturn.trim() === "") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "urlreturn is required when expired is set",
            path: ["urlreturn"],
          });
        }

        const expiredValue = String(data.expired).trim();
        if (!PAYKU_EXPIRED_FORMAT.test(expiredValue)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "expired must use format YYYY-MM-DD HH:mm:ss",
            path: ["expired"],
          });
        } else {
          let expiredAt: Date;
          try {
            expiredAt = parsePaykuExpiredInSantiago(expiredValue);
          } catch {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "expired is not a valid date",
              path: ["expired"],
            });
            return;
          }

          const now = options.now ?? new Date();
          if (
            expiredAt.getTime() <=
            now.getTime() + PAYKU_EXPIRED_MIN_MARGIN_MS
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message:
                "expired must be more than 5 minutes in the future (Santiago)",
              path: ["expired"],
            });
          }
        }
      }

      // 2. Validación de payment según moneda
      if (data.payment !== undefined) {
        const validCodes: readonly number[] =
          data.currency === "CLP"
            ? resolveClpPaymentCodes(options.clpPaymentCodes)
            : Object.values(
                PAYKU_PAYMENT_METHODS[data.currency as PaykuCurrency],
              );

        if (!validCodes.includes(data.payment)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `payment ${data.payment} is not valid for currency ${data.currency}`,
            path: ["payment"],
          });
        }
      }

      // 3. Validación de payer_rut para pagos CLP específicos
      if (data.currency === "CLP" && data.payment !== undefined) {
        if (
          PAYKU_CLP_PAYMENTS_REQUIRING_PAYER_RUT.includes(
            data.payment as (typeof PAYKU_CLP_PAYMENTS_REQUIRING_PAYER_RUT)[number],
          )
        ) {
          const payerRut = data.additional_parameters?.payer_rut;
          if (
            payerRut === undefined ||
            payerRut === null ||
            String(payerRut).trim() === ""
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message:
                "additional_parameters.payer_rut is required for this payment method",
              path: ["additional_parameters", "payer_rut"],
            });
          }
        }
      }

      // 4. Validación de gateway para VES
      if (data.currency === "VES") {
        const gateway = data.additional_parameters?.gateway;
        if (
          gateway !== undefined &&
          !Object.values(PAYKU_VES_GATEWAYS).includes(
            gateway as (typeof PAYKU_VES_GATEWAYS)[keyof typeof PAYKU_VES_GATEWAYS],
          )
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Unknown VES gateway: ${gateway}`,
            path: ["additional_parameters", "gateway"],
          });
        }
      }
    });
}

/**
 * Esquema Zod estándar para validar solicitudes de creación de transacciones.
 */
export const PaykuCreateTransactionSchema = createTransactionSchema();

export type PaykuCreateTransactionRequestInput = z.infer<
  typeof PaykuCreateTransactionSchema
>;
export type PaykuCreateTransactionInput = PaykuCreateTransactionRequestInput;
export type PaykuCreateTransaction = PaykuCreateTransactionRequestInput;

/**
 * Fábrica para construir PaykuChileCreateTransactionSchema con opciones.
 */
export function createChileTransactionSchema(
  options: ValidateCreateTransactionOptions = {},
) {
  const baseValidator = createTransactionSchema(options);

  return z
    .object({
      email: requireNonEmptyString("email"),
      order: requireNonEmptyString("order"),
      subject: requireNonEmptyString("subject"),
      amount: z.number().positive("amount must be greater than 0"),
      urlreturn: requireNonEmptyString("urlreturn"),
      urlnotify: requireNonEmptyString("urlnotify"),
      payment: z.number().int().optional(),
      expired: z.string().optional(),
      additional_parameters:
        PaykuTransactionAdditionalParametersSchema.optional(),
    })
    .passthrough()
    .superRefine((data, ctx) => {
      // Aplica validaciones base fijando currency = "CLP"
      const basePayload = {
        ...data,
        currency: "CLP" as const,
      };

      const result = baseValidator.safeParse(basePayload);
      if (!result.success) {
        for (const issue of result.error.issues) {
          ctx.addIssue(issue);
        }
      }
    });
}

/**
 * Esquema Zod para validar solicitudes de creación de transacciones específicas para Chile (CLP).
 * Exige campos `email`, `order`, `subject`, `urlreturn`, `urlnotify`.
 */
export const PaykuChileCreateTransactionSchema = createChileTransactionSchema();

export type PaykuChileCreateTransactionRequestInput = z.infer<
  typeof PaykuChileCreateTransactionSchema
>;
export type PaykuChileCreateTransactionInput =
  PaykuChileCreateTransactionRequestInput;
export type PaykuChileCreateTransaction =
  PaykuChileCreateTransactionRequestInput;

/**
 * Esquema Zod para validar filtros de listado de transacciones.
 * Exige `per_page` entre 1 y PAYKU_LIST_TRANSACTIONS_MAX_PER_PAGE (4000).
 */
export const PaykuListTransactionsParamsSchema = z
  .object({
    date_init: z.string().optional(),
    date_end: z.string().optional(),
    page: z
      .number()
      .int()
      .min(1, "page must be greater than or equal to 1")
      .optional(),
    per_page: z
      .number()
      .int()
      .min(
        1,
        `per_page must be between 1 and ${PAYKU_LIST_TRANSACTIONS_MAX_PER_PAGE}`,
      )
      .max(
        PAYKU_LIST_TRANSACTIONS_MAX_PER_PAGE,
        `per_page must be between 1 and ${PAYKU_LIST_TRANSACTIONS_MAX_PER_PAGE}`,
      )
      .optional(),
    success: z.boolean().optional(),
    pending: z.boolean().optional(),
    rejected: z.boolean().optional(),
  })
  .passthrough();

export type PaykuListTransactionsParamsInput = z.infer<
  typeof PaykuListTransactionsParamsSchema
>;
export type PaykuListTransactionsParams = PaykuListTransactionsParamsInput;
