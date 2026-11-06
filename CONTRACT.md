# Authentication Host Contract

> **In short:** how a host installs, composes and uses `@nuxt-layers/authentication`, the layer that decides who is signed in. This document is self-contained (ADR-0012 §6). Accepted architecture governs any disagreement, and the implementation is evidence of actual behaviour.

**Contract:** `Authentication`, version `1`. **Status:** in development on `master` (ADR-0008); no release is supported.

**Composition gap (ADR-0012):** the host still composes the layer with several `provide*` calls in its own port shapes. That means no single call yet, no `resolveCaller` or `decide` in the shared shapes, and no `examples/minimal-host`. Everything below is how the layer works today; [PLAN.md](PLAN.md) phase 11 closes the gap.

External documents are named by their entry in [RESOURCES.md](RESOURCES.md).

## What it is

Authentication owns credentials (passwords, passkeys, TOTP, backup codes, provider links, service-identity credentials), sessions, multi-factor authentication and step-up, and abuse controls. It publishes one fact, the `AuthenticatedPrincipal`, and holds no tenant, group, role or profile data: those are Identity's, Authorisation's and Profile's (ADR-0005). It depends on no UI, theme, Identity, Authorisation, database-vendor or mail-provider package.

## Install

```json
"@nuxt-layers/authentication": "github:nuxt-layers/authentication#master"
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({ extends: ['@nuxt-layers/authentication'] })
```

```ts
// server/plugins/authentication.ts
import pg from 'pg'

export default defineNitroPlugin(() => {
  provideAuthenticationDatabase({ dialect: 'postgres', pool: new pg.Pool({ connectionString: process.env.AUTHENTICATION_DATABASE_URL }) })
  provideAuthenticationMailer({ send: async message => { /* deliver with the host's mail service */ } })
  void migrateAuthenticationDatabase()   // requests wait for it
})
```

- **Lockfile:** commit it, install with `--frozen-lockfile` in CI, and refresh it whenever this repository's `master` advances.
- **Install scripts:** the package runs none, so a Git install brings only its runtime dependencies.
- **Node.js:** hosts need 22 or later.
- **Composition:** compose it as a peer of Identity, Authorisation, UI and Theme Manager; it neither extends them nor is extended by them.

## Settings

| Runtime config | Environment variable | Default | Does |
|---|---|---|---|
| `authentication.secret` | `NUXT_AUTHENTICATION_SECRET` | none, **required** | Signs cookies and keys digests. At least 32 random bytes, from secret management |
| `authentication.baseUrl` | `NUXT_AUTHENTICATION_BASE_URL` | none, **required** | The external origin used in links, origin checks and passkeys. `https` in production (loopback excepted) |
| `authentication.trustProxy` | `NUXT_AUTHENTICATION_TRUST_PROXY` | `false` | Read client IPs from `X-Forwarded-For`. Only behind a proxy that overwrites it |
| `authentication.providers.<id>.clientId` / `.clientSecret` | `NUXT_AUTHENTICATION_PROVIDERS_<ID>_CLIENT_ID` / `_CLIENT_SECRET` | unset (off) | Turns on `google`, `microsoft` (also `_TENANT_ID`), `github`, `facebook` or `oidc` (also `_DISCOVERY_URL`, optional `_NAME`) |
| `public.authentication.routes.*` | `NUXT_PUBLIC_AUTHENTICATION_ROUTES_*` | see [Screens](#screens) | Paths used in redirects and email links |
| `public.authentication.locale` | `NUXT_PUBLIC_AUTHENTICATION_LOCALE` | `en-GB` | The pages' language, passed to the mailer |
| `public.authentication.appName` | `NUXT_PUBLIC_AUTHENTICATION_APP_NAME` | the base URL's host | Name in authenticator apps and passkey prompts |
| `authentication.presentation` (`nuxt.config.ts`) | none | `true` | `false`: core only, with no pages, components or presentation auto-imports |
| `authentication.pages.enabled` / `.paths` (`nuxt.config.ts`) | none | `true` / defaults | Turn the pages off or move them |

**Policy:** `provideAuthenticationPolicy(input)` overrides these defaults; unknown keys and values outside the bounds fail at start-up.

| Setting | Default | Bounds |
|---|---|---|
| `password.minLength` / `maxLength` | 15 / 128 | ≥ 8 / ≥ 64 |
| `password.compromisedCheck` | `hibp-range` | or `disabled` |
| `signInThrottle.maxFailedAttempts` / `maxFailedAttemptsPerClient` | 5 / 50 | 3–100 / 10–10 000 |
| `signInThrottle.windowSeconds` / `lockoutSeconds` | 900 / 900 | 60–86 400 |
| `session.idleTimeoutSeconds` / `absoluteLifetimeSeconds` | 3 600 / 86 400 | ≥ 300 and ≤ absolute / 900–2 592 000 |
| `reauthentication.maxAgeSeconds` | 900 | 60–3 600 |
| `mfa` / `emailVerification` | `required` / `required` | or `optional` |
| `rememberedDevice.days` | 0 (off) | 0–30 |
| `breakGlass.enrolmentTokenMinutes` | 60 | 5–1 440 |
| `retention.sessionDays` / `recoveryDays` / `tokenDays` | 90 / 365 / 30 | 30–365 / 30–730 / 1–365 |
| `serviceCredentials.credentialDays` / `tokenMinutes` | 90 / 15 | 1–365 / 5–60 |
| `retention.riskTreatment`, `serviceCredentials.riskTreatment` | `null` | Required when a retention period is shorter, or a service credential or token longer, than its default |

The defaults follow ASVS Level 2 and NIST 800-63 AAL2. A host that loosens any default records the gap and its risk treatment (Security §12).

## Host passes

Each is passed from a Nitro plugin with its function. Without a required one, the first use throws `AuthenticationCompositionError`: there is no fallback store. A malformed port throws `TypeError` at start-up.

| Function | Shape | Required | Without it |
|---|---|---|---|
| `provideAuthenticationDatabase` | `{ dialect: 'postgres', pool, schema? }`. `pool` is any `pg`-compatible pool (`query`, `connect`, `end`); `schema` is a lower-case identifier, `authentication` by default | Yes | Refused |
| `provideAuthenticationMailer` | `{ send(message): Promise<void> }`, where `message` is `{ kind, to, locale, actionUrl, expiresAt, eventType }` and `kind` is `email-verification`, `password-reset`, `email-change-confirmation` or `security-notification` | Yes | Refused. A failing send is logged, and the response is unchanged |
| `provideAuthenticationEventSink` | `{ emit(event): void \| Promise<void> }` | No | Events are dropped. A failing sink is logged; the outcome stands |
| `provideAuthenticationPolicy` | Overrides of the policy above | No | The secure defaults |
| `provideAuthenticationClock` | `{ now(): Date }`, the same clock the host gives every IAM member (*IAM time*) | No | The system clock. A clock that throws or answers no valid `Date` makes that operation `unavailable` |
| `provideAuthenticationIdentity` | `{ reserve({ invitationToken }) → { principalId }, confirm(principalId), standing(principalId) → { standing, passkeyOnly } \| null }`, normally iam-integration's adapter (*IAM provisioning*) | No | The engine issues account identifiers and every account is `allowed`; no service identity gets a token |
| `provideAuthenticationLegalHolds` | `{ covers({ kind: 'person', id }) → Promise<boolean> }` (*IAM retention*) | No | Every credential-recovery record is kept |
| `provideAuthenticationServiceGovernance` | `{ mayManage({ principal, serviceIdentityId }) → Promise<boolean> }` (*IAM adapters*) | No | Every service-credential request is `forbidden` |

**Database:** the host owns the pool (credentials, TLS, pooling). The layer reads and writes only its own schema and creates it with `migrateAuthenticationDatabase()`. That call applies versioned, append-only migrations in one transaction under an advisory lock, so several instances may start at once. Connect as a role that owns only that schema:

```sql
create role authentication_app login password '<generated secret>';
create schema if not exists authentication authorization authentication_app;
revoke all on schema public from authentication_app;
```

**Hosted PostgreSQL:** use it as a plain PostgreSQL endpoint. Never run the provider's own authentication service beside this layer. On Supabase, keep `authentication` out of the Data API's exposed schemas.

## Client and server functions

### The principal

`AuthenticatedPrincipal` (from `./contracts`):

| Field | Meaning |
|---|---|
| `principalId` | Stable, opaque identifier. Store this, never an email address |
| `kind` | `person` (a session) or `service` (a service token) |
| `sessionId` | The session's or service token's opaque identifier |
| `authenticatedAt` / `expiresAt` | The latest primary or step-up authentication / when the session ends |
| `assurance` | `{ level: 'aal1' \| 'aal2', methods, phishingResistant }` |
| `standing` | `allowed`, `resume-only`, `cancel-closure-only` or `verification-only`, from the identity port; always `allowed` without one |

The assurance level follows from the sign-in methods:

| Methods | Level | Phishing resistant |
|---|---|---|
| Password, or a provider alone | `aal1` | No |
| Password or provider, with TOTP, a backup code or a remembered device | `aal2` | No |
| A passkey, alone or after a provider | `aal2` | Yes |
| A service's secret or signed assertion | `aal2` | No, never |

A provider's own MFA is not trusted.

### Server functions (auto-imported)

| Function | Returns or does |
|---|---|
| `getAuthenticatedPrincipal(event)` | The principal, or `null`. Resolved once per request; a bearer token is judged alone, never with a cookie |
| `requireAuthenticatedPrincipal(event, requirement?)` | The principal, or throws `unauthenticated`, `insufficient-assurance`, `reauthentication-required` or `account-restricted`. `requirement`: `{ minimumLevel?, phishingResistant?, maxAuthenticationAgeSeconds?, allowStandings? }`. `minimumLevel` defaults to the policy's level: `aal2` while MFA is required |
| `requiredAssuranceLevel()` | `'aal2'` when MFA is required, otherwise `'aal1'` |
| `migrateAuthenticationDatabase()` | Applies pending migrations |
| `revokeAuthenticationSessions(principalId)` | Ends every session (and a service identity's tokens); returns how many. Call on `identity.paused`, `identity.suspended` and `identity.closure-requested` |
| `discardAuthenticationAccount(principalId)` | Removes an account whose identifier was never verified. Call on `identity.provisioning-expired` |
| `deleteAuthenticationAccount(principalId)` | Deletes the account, its credentials, sessions and sign-in identifier (or a service identity's credentials and tokens). Call on `identity.closed` |
| `getAuthenticationCredentialRecovery(principalId)` | `{ principalId, recoveredAt, method } \| null`, where `method` is `password-reset` or `backup-code` |
| `listAuthenticationCredentialRecoveries({ after?, limit? })` | Recoveries in order (`limit` 100 by default, at most 1 000), with `next`. Used to reconcile with Identity when an event is lost (*IAM recovery*) |
| `exportAuthenticationData({ principalId, correlationId })` | Authentication's part of a data-subject request (*IAM data-subject requests*), or `null`. Never a hash, secret, code, key, token or IP address |
| `runAuthenticationMaintenance({ limit? })` | Ends expired service credentials, warns of expiring ones, applies retention. Returns `{ retention, serviceCredentials: { expired, expiring } }`. The host schedules it |
| `provisionAuthenticationBreakGlass({ identityId, address, correlationId })` | Creates a passkey-only break-glass account after Identity's `provisionIdentityBreakGlass`; returns `{ enrolmentToken, expiresAt }` (ADR-0007) |
| `rotateAuthenticationBreakGlass({ identityId, correlationId })` | Removes its passkeys and sessions and returns a new `{ enrolmentToken, expiresAt }`. Call on Identity's `break-glass.used` |

Maintenance and break-glass functions are server-only: never expose them over HTTP. Hand an enrolment token to the operator only as `<base URL><routes.breakGlassEnrol>#<token>`, over a channel the host trusts, and never log it.

### Client (auto-imported)

- **`useAuthentication()`** returns:
  - `principal`, `isAuthenticated`, `ready`, `refresh()`, `requiredLevel` and `needsSecondFactor`;
  - actions that each resolve to `{ ok: true, data } | { ok: false, code }`: `signUp`, `signIn` (which may answer `second-factor-required`), `verifySecondFactor`, `signInWithPasskey`, `signInWithProvider`, `reauthenticate`, `signOut`, `requestPasswordReset`, `resetPassword`, `changePassword`, `mfaStatus`, `enrolTotp`, `confirmTotp`, `disableTotp`, `regenerateBackupCodes`, `registerPasskey`, `removePasskey`, `listSessions`, `revokeSession`, `revokeOtherSessions`, `federationProviders`, `linkedAccounts`, `linkProvider`, `unlinkProvider`, `breakGlassEnrolmentOptions`, `enrolBreakGlass` and `enrolBreakGlassPasskey`.
- **`useAuthenticationPublicPolicy()`** returns `{ password: { minLength, maxLength }, mfa, rememberedDevice: { days } }`.
- **`safeRedirectPath(candidate, fallback)`** (from `./contracts`) accepts only same-origin absolute paths.
- **Route middleware:**
  - `authenticated` sends anonymous visitors to the sign-in page, and sessions below the required level to the MFA page;
  - `guest` sends signed-in visitors on;
  - `authentication-signed-in` admits any session, even one below the required level.

### HTTP endpoints (`/api/authentication`)

Screens that do not use `useAuthentication()` call these. Every state-changing request needs an `Origin` or `Referer` matching the base URL (`origin-rejected` otherwise), except `POST /service-token`. Bodies are JSON and strict.

| Endpoint | Purpose |
|---|---|
| `POST /sign-up`, `/sign-in`, `/sign-out`; `GET /session`, `/verify-email`, `/policy` | Sign-up and sign-in. Answers do not reveal whether an account exists |
| `POST /password/forgot`, `/password/reset`, `/password/change` | Password recovery and change |
| `GET /sessions`; `DELETE /sessions/:id`; `POST /sessions/revoke-others` | The person's own sessions |
| `POST /mfa/verify`, `/mfa/totp/enrol`, `/mfa/totp/confirm`, `/mfa/totp/disable`, `/mfa/backup-codes`, `/reauthenticate`; `GET /mfa` | Second factors and step-up |
| `POST /passkeys/registration-options`, `/passkeys/registration`, `/passkeys/authentication-options`, `/passkeys/authentication`; `DELETE /passkeys/:id` | Passkeys |
| `GET /federation/providers`, `/federation/:provider/start`, `/federation/callback/:provider`, `/federation/accounts`; `POST /federation/:provider/link`; `DELETE /federation/:provider` | Provider sign-in and linking |
| `POST /break-glass/enrolment-options`, `/break-glass/enrolment` | Break-glass passkey enrolment, gated by the token |
| `POST /service-token` | OAuth 2.0 client credentials for service identities |
| `GET`, `POST /service-identities/:id/credentials`; `DELETE /service-identities/:id/credentials/:credentialId` | Service-identity credentials |

### Errors

Failures are h3 errors whose `data` is `{ code, messageKey }`, with `messageKey` `authentication.error.<code>`:

| Status | Codes |
|---|---|
| 400 | `password-rejected`, `invalid-or-expired-token`, `validation-failed` |
| 401 | `invalid-credentials`, `mfa-required`, `invalid-mfa-code`, `reauthentication-required`, `unauthenticated`, `session-expired` |
| 403 | `email-not-verified`, `insufficient-assurance`, `account-restricted`, `origin-rejected`, `forbidden` |
| 409 | `credential-limit-reached` |
| 429 | `rate-limited` |
| 503 | `unavailable` (engine, database, clock or identity port failure; no details disclosed) |

`POST /service-token` answers OAuth errors instead: `invalid_request`, `unsupported_grant_type`, `invalid_client` (every failed client authentication) or `temporarily_unavailable`.

### Events

The optional sink receives `AuthenticationEvent`s, all namespaced `authentication.*`:

- `account-registered`, `account-deleted`, `account-locked`, `email-verified`;
- `signed-in`, `sign-in-failed` (with a `reason`), `signed-out`, `session-revoked`, `reauthenticated`;
- `password-changed`, `password-reset-requested`, `password-reset-completed`, `credentials-recovered`;
- `mfa-enrolled`, `mfa-removed`, `backup-code-used`, `backup-codes-regenerated`;
- `federated-identity-linked`, `federated-identity-unlinked`;
- `break-glass-provisioned`, `break-glass-enrolled`, `break-glass-rotated`;
- `service-credential-issued`, `service-credential-revoked`, `service-credential-expiring`, `service-token-issued`;
- `retention-applied`, which carries counts only.

Delivery is best effort. Events never carry a credential, code, token or email address, but `client.ipAddress` and `client.userAgent` are personal data the sink's owner must keep and delete. Relay `credentials-recovered` to Identity's `recordIdentityCredentialRecovery`.

## Permissions

Authentication asks about one permission, through the service-governance port:

| Permission | Risk | Effect |
|---|---|---|
| Identity's `identity.service-identities:manage` on the service identity's owning group | High: a credential acts for the group | Lists, issues and revokes that identity's credentials. Issuing and revoking also need a passkey session authenticated within 15 minutes |

Everything else is the host's to decide through Authorisation. Every protected host operation calls `requireAuthenticatedPrincipal` or passes the principal to Authorisation: route middleware is not a security boundary.

## Screens

Optional. Configure them in `nuxt.config.ts`, or turn them off with `presentation: false` (no pages or components) or `pages.enabled: false` (components only).

| Key | Default path | Page |
|---|---|---|
| `signIn` | `/sign-in` | Password, second factor, passkey and provider sign-in |
| `signUp` | `/sign-up` | Create an account |
| `forgotPassword` | `/forgot-password` | Request a reset link |
| `resetPassword` | `/reset-password` | Set a new password from the emailed link |
| `mfa` | `/mfa` | Enrol a second factor or step up |
| `security` | `/account/security` | Password, authenticator, backup codes, passkeys, providers, sessions |
| `breakGlassEnrol` | `/break-glass/enrol` | One-time passkey enrolment from the token in the URL fragment |

`routes.afterSignIn` and `routes.afterSignOut` default to `/`. Moving a page also moves its route.

**Components:** `AuthenticationSignInForm`, `AuthenticationSignUpForm`, `AuthenticationForgotPasswordForm`, `AuthenticationResetPasswordForm`, `AuthenticationMfaPanel`, `AuthenticationTotpEnrolment`, `AuthenticationBackupCodes`, `AuthenticationReauthenticate`, `AuthenticationSecuritySettings`, `AuthenticationBreakGlassEnrolment`, `AuthenticationProviderButtons`, `AuthenticationField` and `AuthenticationAlert`. None of them renders page chrome.

**Styling:** the pages use only the `SemanticPresentationTheme` vocabulary, an optional capability Theme Manager provides. Without it they work unstyled. With it, add the layer's sources after Theme Manager's:

```css
@import "@nuxt-layers/theme-manager/presentation.css";
@import "@nuxt-layers/authentication/tailwind.css";
```

The host's theme must keep these pairings at WCAG AA in light and dark mode:

| Pairing | Minimum contrast |
|---|---|
| `pen-muted-default` on `fill-base-default` | 4.5:1 |
| `pen-error-default` on `fill-base-default` | 4.5:1 |
| `edge-error-default` on `fill-input-default` | 3:1 |
| `edge-base-active` on `fill-base-default` | 3:1 |

Correct a theme in its Theme Definition, never by setting Theme Manager's private `--ui-*` variables.

**Messages:** override the en-GB catalogue (`AUTHENTICATION_MESSAGES_EN_GB` from `./presentation`) or add locales in `app.config.ts`, under `authentication.messages['<locale>']['<key>']`. A key resolves to the host's override, then en-GB, then the key itself.

**Logo:** the host serves `/authentication-logo.png`. Beside the visible text "Authentication", use `alt=""`; shown alone, use `alt="Nuxt Layers Authentication"`. Never copy it elsewhere.

## Headless surface

Any screen, the layer's or the host's, must still:

- **Not reveal accounts:** show sign-in and recovery outcomes without revealing whether an account exists;
- **Show secrets once:** show backup codes and a new service secret exactly once, and never store them;
- **Send people to MFA:** send a session below the required level to enrolment or step-up, using `authentication-signed-in` for that page;
- **Use safe redirects:** honour a `redirect` query only through `safeRedirectPath`;
- **Require user verification for passkeys:** ceremonies come from `@simplewebauthn/browser` through `useAuthentication()`, and an authenticator that does not verify the user is refused;
- **Keep break-glass tokens in the fragment:** read the token from the URL fragment and post it in a request body, never in a query string;
- **Keep federation outcomes coarse:** show `cancelled`, `link-required`, `link-failed` or `failed`, and nothing more specific.

## Storage

**Cookies:**
- **Always:** `authentication.session_token`, plus short-lived cookies during a second factor, a provider sign-in or a passkey ceremony.
- **Only on request:** `authentication.trust_device`, when the host enables remembered devices and the person opts in.
- **Attributes:** first-party, `HttpOnly`, `SameSite=Lax` and `Path=/`, with `Secure` and the `__Secure-` prefix over `https`.

**Elsewhere:**
- No browser storage.
- The layer's PostgreSQL schema holds the account, credentials, sessions (with the user agent, never the IP address), throttling (with client IP addresses), recovery records, break-glass and service-identity data.
- `runAuthenticationMaintenance` applies the retention periods.

**Host obligations:**
- decide notices and consent for its jurisdiction;
- give the event sink and mailer their own retention;
- treat Have I Been Pwned (5 characters of a SHA-1 hash per password) as a classified third party (Privacy §4), or set `password.compromisedCheck: 'disabled'` with a risk treatment.

## You will hit this

- **MFA is required by default.** A password sign-in is `aal1` until a second factor, so `requireAuthenticatedPrincipal` refuses it. Pass `{ minimumLevel: 'aal1' }` only where that is intended.
- **Domains:** passkeys need a registrable domain, not an IP address. The relying-party ID is the base URL's host.
- **Provider callbacks:** register `<base URL>/api/authentication/federation/callback/<id>` with each provider. Accounts are never linked by matching email: a person signs in and links explicitly. Facebook identities can only be linked.
- **Sensitive actions** (changing a password, turning off TOTP, regenerating backup codes, removing a passkey, linking or unlinking a provider) need an authentication within `reauthentication.maxAgeSeconds`. Otherwise they answer `reauthentication-required`.
- **Break-glass accounts** sign in by passkey only and cannot gain a password, TOTP or provider link (`account-restricted`).
- **Service tokens** need the identity port, which must answer `allowed`. They are bearer tokens for the host's own routes, never a session, and never phishing resistant, so never enough for a `critical` permission.
- **Proxies:** set `NUXT_AUTHENTICATION_TRUST_PROXY=true` only behind a proxy that overwrites `X-Forwarded-For`. Otherwise every client shares one throttle.
- **Server-side rendering:** a host's own calls to `/api/authentication` during SSR must use `useRequestFetch()` so the session cookie is forwarded; `useAuthentication()` already does.
- **Imports:** import only the package root, `./contracts`, `./capability`, `./presentation` and `./tailwind.css`. Everything else, including the engine, is private.
- **Tests:** the host tests its own adapters (database, mailer, sink, Identity and Authorisation) and its route protection. The layer's tests cannot prove them.
