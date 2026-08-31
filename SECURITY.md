# Seguridad

## Versiones soportadas

| Versión | Soportada          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |

## Alcance

En scope:

- Manejo de tokens público/privado en el SDK
- Firma HMAC (`Sign`) en endpoints sensibles
- Verificación de callbacks `urlnotify`
- Logging sanitizado opcional (`options.logging`)

Out of scope:

- Configuración del servidor del comercio
- Exposición de tokens en repositorios o logs del usuario

## Reportar vulnerabilidades

Reporta problemas de seguridad vía [GitHub Security Advisories](https://github.com/nicotordev/payku-sdk/security/advisories) o escribiendo a **nicotordev@gmail.com**.

No publiques tokens reales en issues públicos.
