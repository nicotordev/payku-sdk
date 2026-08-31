# Webhooks y seguridad

## Flujo recomendado (Chile)

1. Payku envía POST a tu `urlnotify`
2. **No confíes** solo en el payload
3. Usa `payku.webhooks.verifyNotify()` — reconsulta `GET /api/transaction/{payment_key}`

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

Ten cuidado al comparar `failed` (notify) con `rejected` (API). Ver issues #8–#10 en el roadmap CL.

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
