# @nuxt-layers/authentication

> **AI-Driven Development**
>
> This repository is part of Nuxt Layers, an experimental, AI-driven software engineering initiative.
>
> AI performs the principal architecture, development, testing, security assessment and documentation activities under human direction. The project owner retains authority over requirements, governance, acceptance and releases.
>
> **Our objective is to demonstrate that disciplined, specification-led AI development can deliver secure, maintainable, standards-compliant, production-quality open-source software.**
>
> All contributions are subject to the same engineering standards, quality controls and repository policies, regardless of origin. See *Contributing* in [RESOURCES.md](RESOURCES.md) for the method.


Nuxt 4 **foundation** capability that establishes **who has signed in** and manages the secure lifecycle of the authenticated session.

It is designed to be composed into a host application as a black box: the host supplies infrastructure through documented ports, and everything else stays private to the layer.

> **What it does:** Email and password, verification, reset, sessions, lockout and throttling; TOTP with backup codes, passkeys (including passwordless sign-in) and step-up re-authentication; sign-in with Google, Microsoft, GitHub, Facebook or any OIDC provider (linked only explicitly, by provider subject); break-glass accounts; service identities' client credentials; retention; and accessible, localisable default pages styled through Theme Manager's semantic vocabulary, all on PostgreSQL. **MFA is required by default.** Plans and status are in [PLAN.md](PLAN.md).

## Bounded responsibility

| Owns | Does not own |
|---|---|
| Credentials (passwords, passkeys, TOTP, backup codes) | Names, pictures and every other piece of personal data that describes a person, and the workflows over it (Profile) |
| Sign-in, sign-up, sign-out, email verification, password reset | Identities, groups, organisations, tenancy (Identity) |
| Sessions: creation, rotation, expiry, revocation, active-session list | Permissions, roles, policy decisions (Authorization) |
| Multi-factor enrolment, step-up and re-authentication | Compliance records, KYC, consent (Privacy) |
| Federated sign-in and safe account linking | Navigation, theming, application layouts |
| Abuse controls: throttling, lockout, enumeration resistance | Audit storage and reporting (Audit) |

Authentication is **tenant-agnostic**. It publishes one fact, the `AuthenticatedPrincipal` (principal, session and assurance). Identity maps it to an actor context with groups and organisations, and Authorization decides what that actor may do.

## Public surface

```text
@nuxt-layers/authentication              Nuxt layer (compose with extends)
@nuxt-layers/authentication/contracts    Types, error codes, events, policy, port interfaces
@nuxt-layers/authentication/capability   Capability manifest
@nuxt-layers/authentication/presentation  Page text catalogue and styling classes
@nuxt-layers/authentication/tailwind.css  Tailwind sources for the default pages
```

The layer has three parts with one-way dependencies: the **contract** (plain TypeScript), the **core** (server, endpoints, client API, middleware) and an optional **presentation** (pages, components, text, styling) that uses only the contract and the client API. See [docs/architecture.md](docs/architecture.md).

The layer also provides these, auto-imported for the host:

- **Composition, server side:** `provideAuthenticationDatabase`, `provideAuthenticationMailer`, `provideAuthenticationEventSink`, `provideAuthenticationPolicy`, `provideAuthenticationIdentity`, `provideAuthenticationClock`, `provideAuthenticationLegalHolds`, `provideAuthenticationServiceGovernance`, `migrateAuthenticationDatabase`, `runAuthenticationMaintenance`.
- **Break-glass accounts (ADR-0007), server-only operator functions:** `provisionAuthenticationBreakGlass({ identityId, address, correlationId })` and `rotateAuthenticationBreakGlass({ identityId, correlationId })`, each returning a one-time passkey enrolment token. Never exposed over HTTP; see [docs/contracts.md](docs/contracts.md) §12.
- **Protecting server routes:** `getAuthenticatedPrincipal(event)`, `requireAuthenticatedPrincipal(event, requirement?)`. The latter requires aal2 by default while MFA is required.
- **Client:** the `useAuthentication()` and `useAuthenticationPublicPolicy()` composables, and the `authenticated`, `guest` and `authentication-signed-in` route middleware.
- **Presentation (optional):** default sign-in, sign-up, password recovery, MFA and security pages at configurable paths, the `Authentication*` form components they are built from, `useAuthenticationText()` and the en-GB message catalogue. `authentication: { presentation: false }` registers none of it.
- **HTTP:** endpoints under `/api/authentication/*`.

Every other path is private. See [docs/contracts.md](docs/contracts.md).

## Using it

[CONTRACT.md](CONTRACT.md) is the complete host contract: install, settings, what the host passes, functions, screens, storage and the pitfalls. [STORAGE-REGISTER.md](STORAGE-REGISTER.md) lists everything the layer stores, and [docs/contracts.md](docs/contracts.md) is the detailed specification for maintainers.

A protected server route looks like this:

```ts
// server/api/account/settings.get.ts
export default defineEventHandler(async (event) => {
  const principal = await requireAuthenticatedPrincipal(event)          // 401 signed out, 403 below aal2
  return loadSettings(principal.principalId)
})
```

Route middleware (`definePageMeta({ middleware: 'authenticated' })`) only improves the experience; the server check is the security boundary.

## Security and privacy

The layer targets **OWASP ASVS 5.0 Level 2**, applying relevant Level 3 requirements for authentication and session management, and uses **NIST SP 800-63-4** for assurance terminology. It does not claim certification or formal conformance. See [docs/threat-model.md](docs/threat-model.md).

## Development

```bash
pnpm install
pnpm dev:prepare      # generate Nuxt types (not run on install, so hosts installing from Git get runtime dependencies only)
pnpm test             # Vitest (database suites need AUTHENTICATION_TEST_DATABASE_URL)
pnpm typecheck        # nuxt typecheck (layer, shared, contracts, tests, playground)
pnpm check            # typecheck + test
pnpm dev              # run the playground (set AUTHENTICATION_DATABASE_URL)
pnpm build:playground # production build of the playground
pnpm test:e2e         # Playwright + axe against the built playground (needs AUTHENTICATION_TEST_DATABASE_URL)
```

The playground composes Theme Manager as a devDependency following its latest `master` (ADR-0008). Hosts installing the layer from Git do not get it: the package has no install-time scripts, so only its runtime dependencies are installed.

Database and end-to-end suites run against a **disposable local PostgreSQL**, never a hosted one. Point `AUTHENTICATION_TEST_DATABASE_URL` at an admin connection (for example `postgres://postgres@localhost:5432/postgres`); each suite creates and drops its own database. Without it those suites are skipped locally and **fail in CI**.

## Documentation

- [Host contract](CONTRACT.md)
- [Architecture](docs/architecture.md)
- [Detailed specification](docs/contracts.md)
- [Threat model](docs/threat-model.md)
- [Plan](PLAN.md)
- [Storage register](STORAGE-REGISTER.md)
- [External resources](RESOURCES.md)
- [Legacy layer review](docs/legacy-review.md)
- [Repository security configuration](docs/repository-security.md)
- [Contributing](CONTRIBUTING.md) and [security policy](SECURITY.md)

## License

MIT
