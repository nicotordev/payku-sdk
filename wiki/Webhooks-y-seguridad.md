# Webhooks y seguridad

## Flujo recomendado (Chile)

1. Payku envía POST a tu `urlnotify`
2. **No confíes** solo en el payload
3. Usa `payku.webhooks.verifyNotify()` — reconsulta `GET /api/transaction/{payment_key}` y, si ambos lados tienen `verification_key`, exige que coincidan (`verification_key_mismatch` si no).

```typescript
const result = await payku.webhooks.verifyNotify(payload, {
  expectedOrder: "orden-001",
  expectedAmount: 1000,
});

if (result.valid) {
  // Pago verificado contra la API
}
```

## Estados notify vs API

| Origen              | Valores típicos                                    |
| ------------------- | -------------------------------------------------- |
| Payload `urlnotify` | `success` \| `failed`                              |
| GET transacción     | `register` \| `pending` \| `success` \| `rejected` |

Ten cuidado al comparar `failed` (notify) con `rejected` (API). El helper `mapNotifyStatusToTransactionStatus` hace ese mapeo.

## Firma HMAC (`Sign`)

Endpoints sensibles (wallet payout/withdraw, suscripciones, anulación, marketplace writes, etc.) envían header `Sign`:

- Algoritmo: `HMAC-SHA256(urlencode('/api/path') + '&' + params_ordenados)`
- Implementación: `src/http/sign.ts` — tests en `src/http/sign.test.ts`

## Secretos

- No commitees `.env`, tokens ni payloads Sign reales
- Reportes de seguridad: [SECURITY.md](https://github.com/nicotordev/payku-sdk/blob/main/SECURITY.md) (advisories privados)

## Copilot / CI

- Aprobaciones automáticas de Copilot solo en paths de docs (ver `.github/copilot-approval-paths.txt`)
- Cambios en `src/` y workflows requieren revisión humana
