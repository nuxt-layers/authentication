# Plan

> **In short:** phases 1–8 are done; releases are suspended (ADR-0008), so next come the version reset and ADR-0012 composition. Each phase lands as its own pull request with tests and keeps `pnpm check` green.

External documents are named by their entry in [RESOURCES.md](RESOURCES.md).

## Phases

| Phase | Scope | Status |
|---|---|---|
| 1. Foundation | Package, manifest, public contract, composition ports (fail closed), policy, docs, threat model, CI, playground | Done |
| 2. Core | Better Auth engine (private), PostgreSQL schema and migrations, email and password, email verification, password reset, sessions (rotation, idle and absolute expiry, revocation, active-session list), throttling and lockout, compromised-password check, `getAuthenticatedPrincipal` / `requireAuthenticatedPrincipal`, `useAuthentication()`, route middleware | Done |
| 3. Multi-factor | TOTP with backup codes, passkeys, step-up and re-authentication, MFA-required enrolment flow | Done |
| 4. Federation | Google, Microsoft, GitHub, Facebook and generic OIDC; explicit linking by provider subject only; verified-email account creation; provider tokens discarded | Done |
| 5. Default pages | Accessible (WCAG 2.2 AA), localisable pages and reusable form components styled only through the `SemanticPresentationTheme` vocabulary; host-configurable paths, can be disabled; Playwright and axe end-to-end tests | Done |
| 6. Host integration | Composition into `platform-test-harness` beside Theme Manager and Nuxt UI, with host adapters, principal-to-actor mapping and negative tests; Git installs carry runtime dependencies only; credential-recovery records and `authentication.credentials-recovered`; the optional identity port; `exportAuthenticationData`; `DELIBERATE_PAIRINGS` no longer auto-imported; the optional clock port; break-glass accounts (ADR-0007) | Done |
| 7. Retention | Authentication's part of the suite's end of life (*IAM retention*): retention periods in the policy, `runAuthenticationMaintenance`, the optional legal-hold port and `authentication.retention-applied`. Nothing per group or tenant, so no disposal | Done |
| 8. Service identities | Authentication's part of *IAM service identities*: machine credentials, the client-credentials token endpoint, short-lived opaque bearer tokens, the optional service-governance port, notices, suspension, closure, expiry and retention | Done |
| 9. Release 1.0 | Contract frozen for 1.x and tagged `v1.0.0` | Suspended: releases and tags are suspended until the owner approves a release lifecycle (ADR-0008); the tags are deleted |
| 10. Version reset | Development metadata back to `0.0.0` in `package.json`, `capability.json` and `CHANGELOG.md` | Next, once the owner agrees |
| 11. Composition (ADR-0012) | One call in one server plugin; ports in the shared shapes, including `resolveCaller(event) → { tenantId, subjectId \| null, assurance }`; `examples/minimal-host` within the 50-line budget, built and smoke-tested in CI | Planned |

## Open items

- A manual screen-reader audit of the default pages.
- `sign_in_throttle` has no retention schedule; its client rows hold IP addresses ([STORAGE-REGISTER.md](STORAGE-REGISTER.md)).

## Testing by phase

- **Phase 1:** Vitest unit and contract tests, `nuxt typecheck`, playground build.
- **Phase 2:** integration tests against a disposable PostgreSQL. CI uses a service container; a hosted database is never used in CI.
- **Phase 5:** Playwright end-to-end tests against the built playground composed with Theme Manager: axe (WCAG 2.2 AA rules) in light and dark mode, non-text contrast, reflow, keyboard-only journeys, passkeys through Chromium's virtual authenticator, and a mock OIDC provider.

## Deliberate exclusions

These came from the legacy layer ([docs/legacy-review.md](docs/legacy-review.md)) and are deliberately **not** part of this capability:

- profile data, which is Profile's (ADR-0005). Authentication stores no name or picture, even when a provider supplies one, and never serves or seeds profile attributes;
- permissions and roles, which are Authorisation's;
- compliance, KYC and consent records, which are Privacy's;
- tenancy, which is Identity's and Authorisation's;
- navigation and theme pages, which are the host's and Theme Manager's;
- SMS, push, voice-call and biometric factors. Platform passkeys cover biometrics.
