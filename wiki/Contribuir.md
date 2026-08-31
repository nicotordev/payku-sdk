# Contribuir

Guía completa: [`CONTRIBUTING.md`](https://github.com/nicotordev/payku-sdk/blob/main/CONTRIBUTING.md)

## Quick start

```bash
git clone git@github.com:nicotordev/payku-sdk.git
cd payku-sdk
bun install
bun run lint && bun run build && bun run test:unit
```

## Issues

| Tipo | Template |
| ---- | -------- |
| Bug | [bug_report.yml](https://github.com/nicotordev/payku-sdk/issues/new?template=bug_report.yml) |
| Docs vs API | [docs_parity.yml](https://github.com/nicotordev/payku-sdk/issues/new?template=docs_parity.yml) |
| Feature | [feature_request.yml](https://github.com/nicotordev/payku-sdk/issues/new?template=feature_request.yml) |
| Documentación | [documentation.yml](https://github.com/nicotordev/payku-sdk/issues/new?template=documentation.yml) |

## Pull requests

- Rama desde `main`: `feat/…`, `fix/…`, `docs/…`
- `bun run lint && bun run build && bun run test:unit` antes de abrir PR
- Sin secretos en diffs ni logs

## Codespaces

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/nicotordev/payku-sdk)

Dev container: Bun 1.4.0 en `.devcontainer/devcontainer.json`.

## Sincronizar esta wiki

Las páginas viven en `wiki/` del repo. Tras crear la primera página en GitHub Wiki:

```bash
./scripts/sync-wiki.sh
```

## Code of Conduct

[CODE_OF_CONDUCT.md](https://github.com/nicotordev/payku-sdk/blob/main/CODE_OF_CONDUCT.md)
