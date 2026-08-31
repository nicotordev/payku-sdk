---
applyTo: ".github/**"
excludeAgent: "coding-agent"
---

When reviewing `.github/**` changes (templates, funding, Copilot config):

- Do not approve changes under `.github/workflows/**` (CI must be human-reviewed).
- For issue templates, check labels exist and links point to `nicotordev/payku-sdk`.
- For `FUNDING.yml`, keep the standard GitHub Sponsors comment header.

If the PR touches only safe community paths (not workflows) and looks correct, you may **approve**.
