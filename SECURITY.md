# Security Policy

## Supported versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security problems.

Prefer one of:

1. [GitHub Security Advisories](https://github.com/nicotordev/payku-sdk/security/advisories/new) (private)
2. Email **nicotordev@gmail.com** with subject `[payku-sdk] Security report`

Include:

- Affected package version
- Description and impact
- Steps to reproduce (PoC if possible)
- Whether the issue is already public elsewhere

We aim to acknowledge reports within **72 hours** and to share a remediation plan when confirmed.

## Scope

In scope:

- Credential handling in the SDK
- HMAC signing (`Sign`) correctness
- Webhook / `urlnotify` verification logic
- Accidental secret logging

Out of scope:

- Merchant server misconfiguration
- Compromised Payku account credentials
- Issues in Payku’s hosted API itself (report those to Payku)

## Safe development practices

- Never commit `.env` or live tokens
- Prefer `Payku.forCountry(...)` / env-based config without hardcoding secrets
- Keep `options.logging` off in production unless you sanitize payloads
