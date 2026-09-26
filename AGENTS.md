---
name: payku-sdk
description: Engineering guidelines for AI coding agents working on @nicotordev/payku
---

# Payku SDK — Agent Guide

This document defines the engineering rules for AI coding agents working on `@nicotordev/payku`.

The project is a strongly typed TypeScript SDK for the Payku LATAM payments API.

The SDK should make Payku's API easier and safer to consume without hiding important provider behavior or inventing abstractions that do not exist in the upstream API.

Priorities, in order:

1. Correctness
2. Payment safety
3. API compatibility
4. Type safety
5. Developer experience
6. Maintainability
7. Minimal complexity

---

# 1. Project

Package:

```text
@nicotordev/payku
```

Language:

```text
TypeScript
```

Runtime and tooling:

```text
Bun
```

Supported Payku markets may include:

```text
CL
PE
VE
```

Country-specific behavior must remain explicit through:

```ts
Payku.forCountry("CL");
Payku.forCountry("PE");
Payku.forCountry("VE");
```

Do not silently infer a country from credentials, currency, environment, locale, IP address, or request data unless the public SDK contract explicitly defines such behavior.

---

# 2. Core Agent Behavior

Before implementing a change:

1. Read the relevant existing implementation.
2. Search for related clients, types, tests, and documentation.
3. Read `docs/sdk-spec.md` when the change affects public SDK behavior.
4. Consult `docs/payku.md` for the locally available Payku API reference.
5. Verify uncertain provider behavior against current official Payku documentation or a controlled API request when appropriate.
6. Inspect existing tests before creating new ones.
7. Extend the existing architecture instead of creating parallel abstractions.

Never guess Payku API behavior.

If documentation, observed API behavior, and existing SDK behavior disagree, investigate the discrepancy before changing the public API.

---

# 3. Bun Only

This repository uses Bun.

Use:

```bash
bun install
bun add <package>
bun add -d <package>
bun remove <package>
bun run <script>
bun test
bunx <command>
```

Do not introduce:

```text
npm
npx
yarn
pnpm
jest
ts-node
tsx
dotenv
```

unless Nicolas explicitly requests an architectural change.

Use Bun-native capabilities whenever practical.

For one-off TypeScript investigation, prefer:

```bash
bun -e '...'
```

or execute TypeScript directly:

```bash
bun run script.ts
```

Do not create unnecessary temporary scripts.

If temporary files are useful during investigation, remove them before finishing.

---

# 4. Key Repository Paths

Important locations:

```text
src/clients/payku.ts
docs/sdk-spec.md
docs/payku.md
src/__tests__/
src/http/sign.test.ts
```

Before introducing a new structure, inspect the repository.

Do not assume these are the only relevant paths.

Use:

```bash
rg
fd
git grep
```

to discover related implementation.

---

# 5. Public API Design

The SDK public API should be predictable, discoverable, and strongly typed.

Prefer extending existing clients under:

```text
src/clients/
```

Do not create parallel APIs for functionality that logically belongs to an existing client.

For example, if payment operations already belong to a payment client, extend that client rather than introducing an unrelated standalone helper.

The main facade should remain the primary SDK entry point.

---

# 6. Naming Convention

Public Payku request and response types should follow:

```text
Payku{Action}{Entity}{Request}
Payku{Action}{Entity}{Response}
```

Examples:

```ts
PaykuCreatePaymentRequest;
PaykuCreatePaymentResponse;

PaykuGetPaymentRequest;
PaykuGetPaymentResponse;

PaykuCreateOrderRequest;
PaykuCreateOrderResponse;
```

Keep naming consistent across:

- exported types
- clients
- documentation
- tests
- examples

Do not introduce multiple names for the same Payku concept without a strong compatibility reason.

Provider terminology should generally be preserved when it represents an actual Payku concept.

---

# 7. Strict TypeScript

TypeScript must remain strict.

Do not introduce:

```ts
any;
```

or:

```ts
as any
```

Avoid unsafe type bypasses such as:

```ts
value as unknown as SomeType;
```

Do not use:

```ts
// @ts-ignore
// @ts-nocheck
```

Do not use `@ts-expect-error` as a shortcut around incorrect types.

For public SDK responses, accurately model the provider contract.

Prefer:

- interfaces
- type aliases
- discriminated unions
- generics
- type guards
- schema validation where appropriate
- literal unions

over broad types.

Bad:

```ts
status: string;
```

when Payku provides a documented finite set.

Better:

```ts
status: "pending" | "success" | "failed";
```

only when those values are actually guaranteed by Payku.

Do not invent narrower types than the upstream contract supports.

---

# 8. Provider Data Is Untrusted

Payku is an external system.

TypeScript types alone do not guarantee runtime behavior.

Treat external responses as untrusted data.

Be especially careful around:

- payment status
- transaction identifiers
- order identifiers
- amounts
- currencies
- timestamps
- customer information
- webhook payloads
- error responses

Do not impose undocumented assumptions on opaque provider values.

For example, do not validate a Payku-generated identifier using an invented pattern such as:

```ts
/^ORD[A-Z0-9]+$/;
```

unless Payku explicitly guarantees that contract.

Prefer validating existence and primitive structure when the identifier is opaque.

---

# 9. Country-Specific Behavior

Country-specific developer experience must go through:

```ts
Payku.forCountry(...)
```

Example:

```ts
const payku = Payku.forCountry("CL", options);
```

Country behavior should be centralized rather than scattered throughout unrelated clients.

Avoid patterns such as:

```ts
if (country === "CL") {
  // ...
}
```

repeated across the entire codebase when the behavior can be modeled centrally.

Country differences may include:

- API endpoints
- supported operations
- currency behavior
- payment methods
- required fields
- response contracts

Do not assume the APIs of Chile, Peru, and Venezuela are identical.

Do not expose an operation for a country unless Payku actually supports it there.

---

# 10. HTTP Layer

Keep transport concerns centralized.

The HTTP layer should be responsible for concerns such as:

- base URL handling
- request construction
- authentication headers
- signing
- serialization
- response parsing
- HTTP-level failures

Domain clients should describe Payku operations rather than manually recreating transport logic.

Avoid duplicated `fetch()` implementations across clients.

Do not expose internal HTTP implementation details unnecessarily through the public API.

---

# 11. Authentication and Signing

Authentication and signing are security-critical.

Never modify signing logic based on assumptions.

Before changing signing behavior:

1. Read the existing implementation.
2. Read `src/http/sign.test.ts`.
3. Read the relevant Payku documentation.
4. Verify canonicalization rules.
5. Add or update deterministic test vectors.

Signing code should be deterministic.

The same:

```text
method
path
body
credentials
timestamp
```

must produce the expected signature according to Payku's documented algorithm.

Never log:

- private tokens
- complete signatures
- signing secrets
- authorization headers
- credential-bearing payloads

---

# 12. Secrets

Never commit secrets.

This includes:

```text
.env
.env.local
.env.test
private tokens
public/private credential pairs
Sign headers
authorization headers
real customer information
production transaction data
```

Environment variables may be used for controlled integration testing.

Never hardcode real credentials into:

- tests
- fixtures
- examples
- documentation
- snapshots
- source files

When displaying diagnostic output, redact sensitive values.

---

# 13. Payment Safety

Payment SDK behavior must be conservative.

Do not assume:

```text
HTTP 200 = successful payment
redirect = successful payment
order exists = payment succeeded
request accepted = transaction settled
```

Preserve Payku's actual payment state.

Do not collapse distinct provider states into a generic boolean unless the public API intentionally provides a clearly documented convenience helper.

Prefer exposing authoritative provider information.

For example, an SDK should generally preserve:

```ts
payment.status;
```

rather than hiding all provider state behind:

```ts
payment.success;
```

unless the semantics are unambiguous.

---

# 14. Monetary Values

Never casually transform monetary values.

Respect the units and formats expected by Payku.

Do not convert between:

```text
integer
decimal
string
minor units
major units
```

without verifying the provider contract.

Avoid floating-point arithmetic for SDK-side monetary calculations.

Ideally, the SDK should transport provider amounts rather than recalculate financial values.

If normalization is necessary, document it explicitly.

---

# 15. Error Handling

Errors are part of the public SDK contract.

Preserve useful Payku error information whenever safe.

Differentiate between:

- network failures
- invalid SDK configuration
- authentication failures
- signing failures
- Payku API errors
- malformed responses
- unsupported country operations

Do not swallow provider errors.

Bad:

```ts
try {
  return await request();
} catch {
  return null;
}
```

Avoid throwing generic errors that destroy provider context.

Bad:

```ts
throw new Error("Request failed");
```

when useful HTTP or Payku error information is available.

Errors should help developers understand what failed without leaking credentials.

---

# 16. Backward Compatibility

Treat the public API as a contract.

Before:

- renaming an export
- removing a method
- changing argument order
- changing return types
- changing default behavior
- making an optional field required
- changing error behavior

search the repository for existing usage and consider downstream users.

Prefer additive changes.

Breaking changes require explicit justification and should normally be intentional semver-major changes.

Do not casually "clean up" public naming.

Internal refactoring must not unnecessarily affect consumers.

---

# 17. API Reference Research

Before implementing an unfamiliar Payku endpoint:

1. Search `docs/sdk-spec.md`.
2. Search `docs/payku.md`.
3. Search existing clients.
4. Search existing tests.
5. Check current official Payku documentation when necessary.
6. If ambiguity remains and test credentials are available, probe the API safely.

Useful searches:

```bash
rg "payment" docs src
rg "orders" docs src
rg "forCountry" src
rg "Sign" src
```

Never invent:

- endpoints
- request fields
- response fields
- status values
- HTTP methods
- authentication behavior

based solely on naming intuition.

---

# 18. Controlled API Investigation

When credentials are available in a local environment, controlled requests may be used to understand undocumented or ambiguous Payku behavior.

Use safe test environments whenever available.

Never use real production payments merely to investigate API behavior.

Prefer read-only requests before mutating requests.

When testing transaction creation, use official sandbox/test mechanisms.

Do not print secrets during investigation.

Inline Bun scripts are preferred for quick probes.

Example approach:

```bash
bun -e '/* controlled API probe */'
```

Do not commit investigation code unless it becomes a useful permanent test or example.

---

# 19. Official SDK Independence

`@nicotordev/payku` should stand on its own.

Other SDKs may be inspected privately for research when useful, but they are not authoritative.

The Payku API itself is authoritative.

Do not copy architecture blindly from another SDK.

Do not mention third-party reference SDKs in:

- README content
- API documentation
- examples
- JSDoc
- package descriptions
- user-facing error messages

Public documentation should describe Payku and this SDK directly.

---

# 20. Dependencies

Keep runtime dependencies minimal.

SDKs should avoid forcing unnecessary packages onto consumers.

Before adding a dependency, ask:

> Is this necessary for the SDK, or can Bun/TypeScript/Web APIs solve it cleanly?

Dependencies are appropriate for genuinely complex or security-sensitive problems when they provide meaningful value.

Do not add micro-dependencies for:

- string manipulation
- basic object operations
- simple validation
- URL construction
- trivial utilities

Check package metadata before introducing a dependency:

```bash
bun info <package>
```

Consider:

- maintenance
- package size
- runtime compatibility
- TypeScript quality
- security history
- licensing

---

# 21. Runtime Compatibility

Bun is the development runtime and toolchain.

However, this package is an SDK consumed by external applications.

Do not accidentally introduce Bun-only runtime APIs into the distributed SDK unless Bun-only consumption is an explicit package requirement.

Prefer portable platform APIs in published runtime code when practical.

Development tooling may freely use Bun.

Keep the distinction clear:

```text
development toolchain → Bun-first

published SDK runtime → portable where practical
```

Do not unnecessarily reduce the number of environments capable of consuming the package.

---

# 22. Tests

Tests should protect meaningful SDK behavior.

High-value areas include:

- request signing
- authentication headers
- request serialization
- endpoint construction
- country selection
- response typing/normalization
- error propagation
- public client behavior
- backward compatibility
- unsupported country operations

Avoid tests that merely prove JavaScript or TypeScript works.

Do not create tests simply to increase coverage.

Before adding a test, ask:

> What realistic SDK regression does this prevent?

---

# 23. Test Real Production Code

Tests must exercise the actual implementation.

Do not recreate the signing algorithm inside a test and then compare it against itself.

Bad:

```ts
function testImplementationOfSign(...) {
  // copied production implementation
}
```

Instead, use known deterministic inputs and expected outputs.

For HTTP clients, test observable behavior:

- URL
- HTTP method
- headers
- body
- parsed response
- surfaced errors

Mock only the external boundary when appropriate.

Do not mock the code being tested.

---

# 24. Test Organization

Prefer extending existing test suites over creating many tiny files.

Existing important locations include:

```text
src/__tests__/
src/http/sign.test.ts
```

Group tests by meaningful public behavior.

Avoid files such as:

```text
payment-empty.test.ts
payment-invalid.test.ts
payment-final.test.ts
payment-edge-case.test.ts
payment-robustness.test.ts
```

when the scenarios belong naturally to:

```text
payment.test.ts
```

Keep the suite easy to navigate.

---

# 25. Documentation

Public SDK features should be documented when developers need to know about them.

Documentation should focus on actual usage.

Examples should be:

- short
- executable in spirit
- strongly typed
- consistent with the current API
- free of real credentials

Prefer examples such as:

```ts
import { Payku } from "@nicotordev/payku";

const payku = Payku.forCountry("CL", {
  publicToken: process.env.PAYKU_PUBLIC_TOKEN!,
  privateToken: process.env.PAYKU_PRIVATE_TOKEN!,
});
```

only when the constructor/options shown match the actual SDK.

Never invent example APIs.

Verify examples against the implementation before publishing them.

---

# 26. Documentation Sources

The repository contains two important but different sources:

```text
docs/sdk-spec.md
docs/payku.md
```

Treat them according to their purpose.

`docs/sdk-spec.md` defines intended SDK design and behavior.

`docs/payku.md` contains Payku API reference information.

Neither should override observed upstream behavior blindly if the Payku API has changed.

When contradictions appear, investigate and update the appropriate documentation.

---

# 27. Git Discipline

Before modifying code:

```bash
git status
git branch --show-current
git log --oneline -10
```

Never destroy unrelated local changes.

Review your final diff:

```bash
git diff
git status
```

Prefer focused commits using Conventional Commits.

Examples:

```text
feat(payments): add payment status lookup
fix(sign): preserve canonical request body
feat(pe): add Peru order client
refactor(http): centralize Payku error handling
test(sign): add deterministic signature vectors
docs(cl): document Chile payment flow
```

---

# 28. Scope Discipline

Do not turn a focused SDK change into an unrelated rewrite.

When implementing an endpoint, avoid simultaneously:

- replacing the HTTP architecture
- renaming unrelated exports
- reorganizing every client
- changing formatting across the repository
- upgrading unrelated dependencies

unless those changes are actually required.

Small coherent diffs are easier to review and safer to publish.

---

# 29. Avoid Premature Abstraction

Do not create abstractions merely because several lines look similar.

An SDK benefits from consistency, but excessive generic infrastructure can make provider behavior harder to understand.

Prefer:

```text
clear client
+
shared HTTP transport
+
shared signing
+
strong request/response types
```

over elaborate factories and meta-programming.

Provider-specific differences should remain understandable in the code.

---

# 30. Investigation Workflow

When fixing a bug:

```text
reproduce
→ inspect request
→ inspect signing
→ inspect response
→ compare documentation
→ isolate SDK behavior
→ fix
→ add regression test
→ validate
```

Do not randomly change headers, payload formats, endpoints, or signatures until a request happens to succeed.

Payment API bugs require understanding the contract.

---

# 31. Before Finishing

Always run:

```bash
bun run lint
bun run build
bun run test:unit
```

Equivalent combined command:

```bash
bun run lint && bun run build && bun run test:unit
```

All must pass before declaring the task complete.

If the task affects additional test suites, run them too.

If `package.json` provides a relevant integration or full test command, run it when appropriate.

Do not claim validation passed unless the commands were actually executed.

---

# 32. Final Self-Review

Before finishing:

```bash
git diff
git status
```

Review the diff as if reviewing an external Pull Request.

Check:

- Is the public API consistent?
- Is this backward compatible?
- Are request/response types accurate?
- Did we preserve provider semantics?
- Could credentials leak?
- Is signing behavior unchanged unless intentionally modified?
- Are country differences correctly modeled?
- Did we duplicate an existing client or abstraction?
- Are tests protecting real behavior?
- Are docs and examples accurate?
- Did lint pass?
- Did build pass?
- Did unit tests pass?

Remove temporary debugging artifacts.

---

# 33. Final Rule

This SDK sits between developers and a payment provider.

Correctness matters more than cleverness.

Never guess a payment API contract when it can be verified.

Never hide important provider behavior merely to make the SDK look simpler.

Never weaken types to make implementation easier.

Never leak credentials.

Never casually break the public API.

Never assume all countries behave identically.

Never reproduce transport or signing logic across clients.

Never add dependencies without justification.

Never optimize for test count.

Inspect the provider contract, understand the existing SDK, implement the smallest correct abstraction, test the real behavior, and ship a predictable developer experience.
