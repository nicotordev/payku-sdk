import { describe } from "bun:test";
import Payku from "../clients/payku";
import type { PaykuChile } from "../clients/payku.chile";
import {
  PaykuError,
  type PaykuAPIErrorLogEvent,
  type PaykuClientOptions,
  type PaykuLogger,
} from "../errors";

/** Timeout estándar recomendado para llamadas contra Payku Sandbox (20 segundos). */
export const SANDBOX_TIMEOUT_MS = 20_000;

/** Timeout extendido para operaciones compuestas o con latencia en Sandbox (45 segundos). */
export const SANDBOX_LONG_TIMEOUT_MS = 45_000;

/** RUT válido de prueba para transacciones en Sandbox Chile. */
export const SANDBOX_TEST_RUT = "11111111-1";

const PLACEHOLDER_VALUES = new Set([
  "",
  "your_public_token",
  "your_private_token",
]);

const hasRealCredential = (value: string | undefined): boolean =>
  value !== undefined && value !== "" && !PLACEHOLDER_VALUES.has(value);

/**
 * Valida de forma estricta que el entorno configurado sea "sandbox".
 * Lanza un error de seguridad inmediato si se detecta cualquier otro entorno.
 */
export function assertSandboxEnvironment(
  env: string | undefined = process.env.PAYKU_ENVIRONMENT,
): void {
  const normalized = (env ?? "sandbox").trim().toLowerCase();
  if (normalized !== "sandbox") {
    throw new Error(
      `[SECURITY ERROR] Las pruebas de integración de Payku están estrictamente restringidas a "sandbox". ` +
        `Se detectó PAYKU_ENVIRONMENT="${env}". Se aborta la ejecución para prevenir alteraciones en producción.`,
    );
  }
}

// Si PAYKU_ENVIRONMENT está presente en el proceso y no es sandbox, abortar inmediatamente
if (
  process.env.PAYKU_ENVIRONMENT &&
  process.env.PAYKU_ENVIRONMENT.trim().toLowerCase() !== "sandbox"
) {
  assertSandboxEnvironment();
}

export const paykuIntegrationConfig = {
  publicToken: process.env.PAYKU_PUBLIC_TOKEN ?? "",
  privateToken: process.env.PAYKU_PRIVATE_TOKEN ?? "",
  environment: process.env.PAYKU_ENVIRONMENT ?? "sandbox",
};

export const hasPaykuIntegrationCredentials =
  hasRealCredential(paykuIntegrationConfig.publicToken) &&
  hasRealCredential(paykuIntegrationConfig.privateToken);

/**
 * Corre solo con tokens reales y `PAYKU_ENVIRONMENT=sandbox`.
 */
export const shouldRunIntegrationTests =
  paykuIntegrationConfig.environment === "sandbox" &&
  hasPaykuIntegrationCredentials;

// Si se activa PAYKU_STRICT_INTEGRATION (ej. en CI con secrets configurados) y faltan credenciales, fallar con error accionable
if (
  process.env.PAYKU_STRICT_INTEGRATION === "1" ||
  process.env.PAYKU_STRICT_INTEGRATION === "true"
) {
  if (!shouldRunIntegrationTests) {
    throw new Error(
      `[PAYKU_STRICT_INTEGRATION] Se requirió ejecución estricta de smoke tests pero no se encontraron ` +
        `credenciales sandbox válidas en el entorno. Configure PAYKU_PUBLIC_TOKEN y PAYKU_PRIVATE_TOKEN válidos.`,
    );
  }
}

let warnedMissingCredentials = false;

/** Imprime un aviso claro y accionable cuando los smoke tests son omitidos por falta de tokens. */
export function printIntegrationSkipNoticeIfNeeded(): void {
  if (!shouldRunIntegrationTests && !warnedMissingCredentials) {
    warnedMissingCredentials = true;
    console.warn(
      `\n⚠️  [Payku Integration] Omitiendo tests de integración reales contra sandbox:\n` +
        `   Se requieren credenciales válidas en PAYKU_PUBLIC_TOKEN y PAYKU_PRIVATE_TOKEN (con PAYKU_ENVIRONMENT=sandbox).\n` +
        `   Consulta .env.example y docs/smoke-tests.md para configurarlos.\n`,
    );
  }
}

export const describePaykuIntegration = shouldRunIntegrationTests
  ? describe
  : (((title: string, fn: () => void) => {
      printIntegrationSkipNoticeIfNeeded();
      return describe.skip(title, fn);
    }) as typeof describe);

// ---------------------------------------------------------------------------
// Generadores de identificadores únicos (Prevención de colisiones concurrentes)
// ---------------------------------------------------------------------------

let sequenceCounter = 0;

/**
 * Genera un identificador único seguro frente a ejecuciones concurrentes en CI o local.
 *
 * @param prefix Prefijo identificatorio (ej. "smoke", "plan", "order").
 * @param maxLength Longitud máxima opcional (ej. Payku suplan limita a 20 caracteres).
 */
export function generateUniqueId(prefix = "smoke", maxLength?: number): string {
  sequenceCounter = (sequenceCounter + 1) % 1000;
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 6);
  const raw = `${prefix}_${time}_${rand}`;

  if (maxLength && raw.length > maxLength) {
    const suffix = `_${time.slice(-4)}_${rand}`;
    const allowedPrefixLen = Math.max(1, maxLength - suffix.length);
    return `${prefix.slice(0, allowedPrefixLen)}${suffix}`.slice(0, maxLength);
  }

  return raw;
}

/**
 * Genera un código de orden único para transacciones en sandbox.
 */
export function generateUniqueOrder(prefix = "order"): string {
  return generateUniqueId(prefix);
}

/**
 * Genera una dirección de email única para evitar colisiones de usuario único en sandbox.
 */
export function generateUniqueEmail(prefix = "smoke"): string {
  const uid = generateUniqueId(prefix).replace(/_/g, "-");
  return `${uid}@example.com`;
}

/**
 * Genera un número de teléfono móvil de 9 dígitos.
 */
export function generateUniquePhone(): string {
  const rand = Math.floor(10000000 + Math.random() * 90000000);
  return `9${rand}`;
}

// ---------------------------------------------------------------------------
// Tolerancia a latencia y reintentos en Sandbox
// ---------------------------------------------------------------------------

export interface RetryOptions {
  maxRetries?: number;
  delayMs?: number;
  shouldRetry?: (error: unknown) => boolean;
}

/**
 * Ejecuta una operación asíncrona reintentando en caso de fallos transitorios de red.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const maxRetries = options.maxRetries ?? 2;
  const delayMs = options.delayMs ?? 1000;

  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === maxRetries) {
        break;
      }
      if (options.shouldRetry && !options.shouldRetry(error)) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
    }
  }

  throw lastError;
}

// ---------------------------------------------------------------------------
// Helpers para Cleanup de recursos
// ---------------------------------------------------------------------------

export interface CleanupTask {
  name?: string;
  fn: () => Promise<void>;
}

/**
 * Registrador de tareas de limpieza que se ejecutan en orden LIFO.
 * Garantiza que cada tarea se ejecute aun cuando una de ellas falle.
 */
export class IntegrationCleanupTracker {
  private tasks: CleanupTask[] = [];

  public register(fn: () => Promise<void>, name?: string): void {
    this.tasks.push({ name, fn });
  }

  public async runAll(): Promise<{ executed: number; failed: number }> {
    const toRun = [...this.tasks].reverse();
    this.tasks = [];
    let executed = 0;
    let failed = 0;

    for (const task of toRun) {
      try {
        await task.fn();
        executed++;
      } catch {
        failed++;
      }
    }

    return { executed, failed };
  }

  public get pendingCount(): number {
    return this.tasks.length;
  }
}

/**
 * Ejecuta una función suministrándole un IntegrationCleanupTracker y ejecutando
 * todas las tareas de cleanup en el bloque `finally`.
 */
export async function withCleanup<T>(
  action: (tracker: IntegrationCleanupTracker) => Promise<T>,
): Promise<T> {
  const tracker = new IntegrationCleanupTracker();
  try {
    return await action(tracker);
  } finally {
    await tracker.runAll();
  }
}

// ---------------------------------------------------------------------------
// Redacción de tokens, firmas HMAC y datos sensibles en logs
// ---------------------------------------------------------------------------

const SENSITIVE_KEYS = new Set([
  "publictoken",
  "privatetoken",
  "sign",
  "token",
  "verification_key",
  "verification_token",
  "authorization",
  "signature",
  "secret",
  "password",
]);

/**
 * Redacta tokens específicos y patrones de autorización en strings.
 */
export function redactSensitiveString(text: string): string {
  let redacted = text;
  if (paykuIntegrationConfig.publicToken) {
    redacted = redacted.replaceAll(
      paykuIntegrationConfig.publicToken,
      "[REDACTED_PUBLIC_TOKEN]",
    );
  }
  if (paykuIntegrationConfig.privateToken) {
    redacted = redacted.replaceAll(
      paykuIntegrationConfig.privateToken,
      "[REDACTED_PRIVATE_TOKEN]",
    );
  }
  // Reemplazar headers Bearer
  redacted = redacted.replace(/Bearer\s+[A-Za-z0-9_\-.]+/gi, "Bearer [REDACTED]");
  // Reemplazar hashes HMAC hex de 64 caracteres
  redacted = redacted.replace(/Sign:\s*[a-f0-9]{64}/gi, "Sign: [REDACTED_SIGN]");
  return redacted;
}

/**
 * Redacta datos sensibles de forma recursiva en objetos, arrays y cadenas.
 */
export function redactSensitiveData(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === "string") {
    return redactSensitiveString(data);
  }

  if (Array.isArray(data)) {
    return data.map((item) => redactSensitiveData(item));
  }

  if (typeof data === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(
      data as Record<string, unknown>,
    )) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.has(lowerKey)) {
        result[key] = "[REDACTED]";
      } else {
        result[key] = redactSensitiveData(value);
      }
    }
    return result;
  }

  return data;
}

/**
 * Crea una instancia de PaykuLogger que aplica redacción de secretos antes de emitir errores.
 */
export function createSandboxRedactingLogger(
  baseLogger?: PaykuLogger,
): PaykuLogger {
  return {
    error(event: PaykuAPIErrorLogEvent) {
      const safeEvent: PaykuAPIErrorLogEvent = {
        operation: event.operation,
        statusCode: event.statusCode,
        type: event.type,
        message: redactSensitiveString(event.message),
      };
      if (baseLogger) {
        baseLogger.error(safeEvent);
      } else {
        console.error("[Payku Sandbox API Error]", safeEvent);
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Clientes Sandbox
// ---------------------------------------------------------------------------

/**
 * Crea un cliente Chile apuntando de forma segura a Payku Sandbox.
 */
export function createSandboxChileClient(
  options: PaykuClientOptions = {},
): PaykuChile {
  assertSandboxEnvironment();
  return Payku.forCountry("CL", {
    publicToken: paykuIntegrationConfig.publicToken,
    privateToken: paykuIntegrationConfig.privateToken,
    environment: "sandbox",
    options: {
      ...options,
      logger: options.logger
        ? createSandboxRedactingLogger(options.logger)
        : undefined,
    },
  });
}

/**
 * Crea un cliente Payku global apuntando de forma segura a Payku Sandbox.
 */
export function createSandboxClient(options: PaykuClientOptions = {}): Payku {
  assertSandboxEnvironment();
  return new Payku(
    paykuIntegrationConfig.publicToken,
    paykuIntegrationConfig.privateToken,
    "sandbox",
    {
      ...options,
      logger: options.logger
        ? createSandboxRedactingLogger(options.logger)
        : undefined,
    },
  );
}

const CAPABILITY_HINTS = [
  "no habilit",
  "not enabled",
  "not available",
  "sin acceso",
  "forbidden",
  "permission",
  "permiso",
] as const;

/** Payku rechazó la firma, no el producto. */
export function isSignRejection(error: unknown): boolean {
  if (!(error instanceof PaykuError)) {
    return false;
  }

  const text = `${error.type ?? ""} ${error.message}`.toLowerCase();
  return (
    text.includes("waiting sign") ||
    text.includes("invalid sign") ||
    text.includes("firma")
  );
}

/**
 * Producto no habilitado en la cuenta sandbox.
 * No trata un rechazo de firma como falta de capability.
 */
export function capabilityDependentReason(error: unknown): string | undefined {
  if (!(error instanceof PaykuError) || isSignRejection(error)) {
    return undefined;
  }

  if (error.statusCode === 403) {
    return `HTTP ${error.statusCode}`;
  }

  const message = error.message.toLowerCase();
  if (CAPABILITY_HINTS.some((hint) => message.includes(hint))) {
    return error.message;
  }

  return undefined;
}

/** Avisa y devuelve true cuando el sandbox no tiene ese producto habilitado. */
export function noteCapabilityDependent(
  product: string,
  error: unknown,
): boolean {
  const reason = capabilityDependentReason(error);
  if (reason === undefined) {
    return false;
  }

  console.warn(
    `CAPABILITY_DEPENDENT ${product}: ${redactSensitiveString(reason)}`,
  );
  return true;
}

/** Fecha `YYYY-MM-DD` en America/Santiago. */
export function santiagoDateOnly(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
