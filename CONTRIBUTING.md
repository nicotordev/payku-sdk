# Contributing to @nicotordev/payku

Thanks for helping improve the Payku TypeScript SDK. This guide covers how to propose changes in a way that is easy to review and merge.

## Code of Conduct

By participating, you agree to follow our [Code of Conduct](./CODE_OF_CONDUCT.md).

## Ways to contribute

- Report bugs via [Bug report](https://github.com/nicotordev/payku-sdk/issues/new?template=bug_report.yml)
- Report Payku Docs vs SDK mismatches via [Docs / API parity](https://github.com/nicotordev/payku-sdk/issues/new?template=docs_parity.yml)
- Request features via [Feature request](https://github.com/nicotordev/payku-sdk/issues/new?template=feature_request.yml)
- Improve docs via [Documentation](https://github.com/nicotordev/payku-sdk/issues/new?template=documentation.yml)
- Improve docs (`README.md`, `docs/`, examples)
- Fix bugs or implement features with a pull request
- Join [Discussions](https://github.com/nicotordev/payku-sdk/discussions) for questions and ideas

## Development setup

Requirements:

- [Bun](https://bun.sh) `1.4.x`
- GitHub CLI optional (`gh`) for PRs

```bash
git clone git@github.com:nicotordev/payku-sdk.git
cd payku-sdk
bun install
cp .env.example .env   # fill tokens only for local integration tests
bun run lint
bun run build
bun run test:unit
```

Never commit real Payku tokens. Use placeholders in docs/examples.

## GitHub Codespaces (optional)

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/nicotordev/payku-sdk)

The repo includes [`.devcontainer/devcontainer.json`](./.devcontainer/devcontainer.json) (Bun 1.4.0). After the codespace starts:

```bash
bun run lint && bun run build && bun run test:unit
```

Integration tests stay off by default (`PAYKU_RUN_INTEGRATION_TESTS=false`). Edit `.env` locally in the codespace only if you add sandbox tokens.

### Prebuilds (maintainers)

Prebuilds are configured in the GitHub UI, not via `gh codespace`:

1. [Settings → Codespaces](https://github.com/nicotordev/payku-sdk/settings/codespaces)
2. **Set up prebuild**
3. **Branch:** `main`
4. **Dev container:** `.devcontainer/devcontainer.json`
5. **Trigger:** every push to the branch (or manual if you want to save minutes)
6. **Region:** pick the closest to you (e.g. `East US`); one region is enough for a small SDK

Each prebuild run consumes Codespaces compute on your account. For this repo the gain is mainly skipping `bun install` (~1–2 min). Verify with:

```bash
gh codespace create -r nicotordev/payku-sdk -b main
gh codespace view --web
# In the codespace, check prebuild: true via API after creation
```

## Wiki

Guías ampliadas en [GitHub Wiki](https://github.com/nicotordev/payku-sdk/wiki). Fuente en [`wiki/`](./wiki/).

**Primera vez (maintainers):** crea [Home](https://github.com/nicotordev/payku-sdk/wiki/_new) en la UI (pega `wiki/Home.md`), luego:

```bash
./scripts/sync-wiki.sh
```

## Branching

1. Fork the repo (or create a branch if you have write access)
2. Create a branch from `main`:

```bash
git checkout -b feat/short-description
```

Suggested prefixes: `feat/`, `fix/`, `docs/`, `chore/`, `test/`.

## Coding guidelines

- Prefer Bun APIs and scripts (`bun test`, `bun run build`)
- Keep public API stable unless the PR intentionally introduces a breaking change
- Add/update types before implementing new endpoints
- Follow naming in [`docs/sdk-spec.md`](./docs/sdk-spec.md)
- Do not log secrets (`publicToken`, `privateToken`, `Sign` payloads)
- Keep commits focused; Spanish or English commit messages are both fine

## Tests

Unit tests must pass:

```bash
bun run test:unit
```

Integration tests hit Payku and are gated:

```bash
PAYKU_RUN_INTEGRATION_TESTS=true bun run test:integration
```

Do not enable integration tests in CI PRs.

## Pull requests

Use the PR template. Include:

- What changed and why
- How you tested it
- Breaking changes / migration notes if any
- Linked issue (`Fixes #123`) when applicable

CI (lint → build → unit tests) must be green before merge.

## Release notes

User-facing changes belong in [`CHANGELOG.md`](./CHANGELOG.md) under an `Unreleased` or next version section.

## Security

Please do **not** open public issues for vulnerabilities. See [`SECURITY.md`](./SECURITY.md).

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
