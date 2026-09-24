# Smoke Tests en Payku Sandbox (`des.payku.cl`)

Esta guía describe la infraestructura común y las pautas para ejecutar pruebas de integración y smoke tests contra el entorno real de **Payku Sandbox** (`https://des.payku.cl`).

---

## 1. Filosofía: Smoke Tests vs Unit Tests

- **Unit Tests (`bun run test:unit`)**: Validan exhaustivamente la lógica interna del SDK, validaciones Zod, firmas HMAC, serialización wire, transformaciones de respuesta, manejo de errores y compatibilidad de métodos con mocks controlados. Se ejecutan automáticamente en cada commit y en CI pública sin requerir credenciales ni conectividad.
- **Smoke Tests (`bun run test:smoke`)**: Validan la conectividad y el contrato real contra los endpoints en vivo de Payku Sandbox (`https://des.payku.cl`). Comprueban que la API responde con los esquemas esperados, que las firmas HMAC son aceptadas por la pasarela y que las credenciales funcionan correctamente.

---

## 2. Guardrails de Seguridad

Para garantizar que los smoke tests **nunca** alteren datos de producción ni expongan secretos:

1. **Restricción estricta de entorno**: La suite solo puede ejecutarse cuando `PAYKU_ENVIRONMENT=sandbox`. Si `PAYKU_ENVIRONMENT` tiene cualquier otro valor (ej. `production`), la ejecución aborta de inmediato lanzando un error fatal.
2. **Redacción de secretos**: Los clientes creados mediante `createSandboxChileClient()` y `createSandboxClient()` aplican automáticamente un logger con redactor que enmascara `PAYKU_PUBLIC_TOKEN`, `PAYKU_PRIVATE_TOKEN`, encabezados `Bearer` y firmas HMAC (`Sign`).
3. **Aislamiento en git y discovery**:
   - `bunfig.toml` excluye la carpeta `src/__tests__/integration/**` de la ejecución predeterminada de `bun test`.
   - `.env` está ignorado en `.gitignore` para evitar commits accidentales de credenciales.

---

## 3. Variables de Entorno Requeridas

Para habilitar la ejecución de los smoke tests en local, crea un archivo `.env` en la raíz del proyecto (basado en `.env.example`):

```bash
# Tokens obtenidos desde tu cuenta Payku Sandbox (Integración → Tokens integración y API)
PAYKU_PUBLIC_TOKEN=tk_pub_...
PAYKU_PRIVATE_TOKEN=tk_priv_...

# Debe ser estrictamente "sandbox"
PAYKU_ENVIRONMENT=sandbox

# Opcional: falla inmediatamente si faltan tokens (útil en CI protegida)
# PAYKU_STRICT_INTEGRATION=1
```

> [!NOTE]
> Si no defines tokens reales en `.env`, los smoke tests se omiten automáticamente de forma segura con un aviso explicativo, permitiendo correr comandos generales sin fallar.

---

### Ejecutar Smoke Tests

Ejecuta el conjunto completo de las 9 suites de pruebas de integración (`credentials`, `banks`, `payment-methods`, `transactions`, `marketplace`, `mall`, `wallet`, `escrow`, `conciliation`). Tenga en cuenta que los módulos como Marketplace, Mall y Wallet pueden crear recursos temporales en Sandbox y consumir mayor tiempo y cuota de red:

```bash
bun run test:smoke
```

### Ejecutar toda la suite de integración

```bash
bun run test:integration
```

### Ejecutar un módulo concreto

Para ejecutar únicamente los smoke tests de un módulo específico (por ejemplo, transacciones o marketplace), pasa la ruta al archivo:

```bash
bun test --path-ignore-patterns '' src/__tests__/integration/transactions.test.ts
bun test --path-ignore-patterns '' src/__tests__/integration/banks.test.ts
bun test --path-ignore-patterns '' src/__tests__/integration/payment-methods.test.ts
bun test --path-ignore-patterns '' src/__tests__/integration/sign.test.ts
bun test --path-ignore-patterns '' src/__tests__/integration/subscriptions.test.ts
bun test --path-ignore-patterns '' src/__tests__/integration/consumption.test.ts
bun test --path-ignore-patterns '' src/__tests__/integration/marketplace.test.ts
```

O usando el flag de filtro por nombre de suite:

```bash
bun run test:integration -t "transactions"
bun run test:integration -t "marketplace"
```

---

## 5. Helpers y Buenas Prácticas

Todas las utilidades de infraestructura residen en `src/test-utils/paykuIntegration.ts`:

### 5.1 Prevención de colisiones entre ejecuciones concurrentes

Para evitar que dos ejecuciones simultáneas colisionen con los mismos identificadores (por ejemplo, órdenes duplicadas o emails ya registrados), usa los generadores integrados:

```typescript
import {
  generateUniqueOrder,
  generateUniqueEmail,
  generateUniquePhone,
  generateUniqueId,
  SANDBOX_TEST_RUT,
} from "../../test-utils/paykuIntegration";

// Orden única: "order_m8yq12a_x91z"
const order = generateUniqueOrder();

// Email único: "smoke-m8yq12a-x91z@example.com"
const email = generateUniqueEmail("cliente");

// Teléfono móvil chileno válido de 9 dígitos
const phone = generateUniquePhone();

// RUT de prueba estándar para Sandbox Chile
const rut = SANDBOX_TEST_RUT; // "11111111-1"
```

### 5.2 Limpieza automática de recursos (Cleanup)

Para endpoints que permitan borrado o reversión (como `marketplace.clients.delete`), utiliza `withCleanup` o `IntegrationCleanupTracker`. Esto garantiza que los recursos creados se eliminen aun cuando las aserciones de la prueba fallen:

```typescript
import { withCleanup, createSandboxChileClient } from "../../test-utils/paykuIntegration";

test("crea y elimina un cliente", async () => {
  await withCleanup(async (tracker) => {
    const payku = createSandboxChileClient();
    const created = await payku.marketplace.clients.create({ /* ... */ });

    // Registra la tarea de borrado (se ejecutará en orden LIFO en el bloque finally)
    tracker.register(async () => {
      await payku.marketplace.clients.delete(created.id);
    }, "eliminar cliente temporal");

    expect(created.id).toBeTruthy();
  });
});
```

### 5.3 Manejo de latencia y reintentos en Sandbox

El entorno de pruebas de Payku puede experimentar latencia o micro-cortes transitorios. Para ello, se definen constantes de timeout y utilidades de reintento:

```typescript
import {
  SANDBOX_TIMEOUT_MS,
  withRetry,
  createSandboxChileClient,
} from "../../test-utils/paykuIntegration";

// Timeout por prueba de 20s
test("consulta endpoint con reintentos ante jitter", async () => {
  const payku = createSandboxChileClient();
  const balance = await withRetry(async () => {
    return await payku.wallet.balance();
  }, { maxRetries: 2, delayMs: 1000 });

  expect(balance).toBeDefined();
}, SANDBOX_TIMEOUT_MS);
```

### 5.4 Detección explícita de Capabilities (`runCapabilityTest`)

Para módulos cuyo acceso depende de productos o funcionalidades activas en la cuenta Payku (como Escrow, Marketplace, Mall, Wallet Payouts o Conciliación), se utiliza `runCapabilityTest`:

```typescript
import { runCapabilityTest } from "../../test-utils/paykuIntegration";

const result = await runCapabilityTest("escrow.authorize", () =>
  payku.escrow.authorize({ transactions: ["trx_123"] })
);

if (result.status === "skipped") {
  // Queda registrado explícitamente como skipped: capability unavailable
  expect(result.reason).toContain("skipped: capability unavailable");
  return;
}

// Procede con las aserciones si la capability está habilitada
expect(result.value.transactions).toBeDefined();
```

### 5.5 Contratos mínimos sin snapshots frágiles

Los tests de smoke deben validar que los campos críticos y tipos básicos existan y tengan formatos coherentes (`id`, `status`, URLs `https://...`), evitando aserciones rígidas sobre datos dinámicos que cambian con el tiempo (como listas de transacciones o balances fluctuantes).

---

## 6. Ejecución en CI Protegida (`smoke-tests.yml`)

El proyecto cuenta con un workflow dedicado en GitHub Actions ([`.github/workflows/smoke-tests.yml`](../.github/workflows/smoke-tests.yml)) que se ejecuta para pull requests elegibles dirigidas a `main` y pushes a `main` contra el Sandbox de Payku.

### Prevención de saturación y colas en Sandbox
1. **Cola de concurrencia global (`group: payku-sandbox-smoke-tests`, `cancel-in-progress: false`, `queue: max`)**: A nivel del job solo corre 1 ejecución simultánea contra el Sandbox en todo el repositorio, con hasta 100 ejecuciones pendientes; si la cola está llena, GitHub cancela las ejecuciones adicionales. A nivel del workflow, un grupo por PR conserva la ejecución activa y reemplaza únicamente la ejecución pendiente de esa misma PR cuando llega una nueva.
2. **Suite Smoke (`bun run test:smoke`)**: En cada PR elegible y push a `main` se ejecutan los smoke tests para validar la integración.
3. **Filtro de rutas (`paths`)**: No se dispara si los cambios solo tocan documentación (`docs/**`, `wiki/**`, `*.md`).
4. **Protección para forks**: Si una pull request proviene de un fork externo (sin acceso a los secrets del repositorio), el workflow detecta la falta de secretos, emite un aviso explicativo de GitHub Actions y omite los smoke tests finalizando de forma limpia sin bloquear el merge.
5. **Ejecución manual flexible (`workflow_dispatch`)**: Permite correr manualmente el workflow desde la pestaña Actions de GitHub seleccionando la suite:
   - `smoke` (Core rápida, predeterminada).
   - `integration` (Suite completa de integración).

### Secretos en GitHub Actions
Los siguientes secretos están configurados en el repositorio:
- `PAYKU_PUBLIC_TOKEN`
- `PAYKU_PRIVATE_TOKEN`
- `PAYKU_ENVIRONMENT` (`sandbox`)
