# Storage register

> **In short:** Authentication stores sign-in data in its own PostgreSQL schema and sets only first-party, `HttpOnly`, `SameSite=Lax` cookies that sign-in needs. It uses no browser storage and nothing third-party. This is the factual inventory Privacy §5 requires; the host decides notices and consent.

Everything here is implemented. Anything not confirmed from the code is marked **unverified**. External documents are named by their entry in [RESOURCES.md](RESOURCES.md).

## Cookies

Every cookie is set by the engine for the layer:

- **Attributes:** first-party and host-only (no `Domain` attribute), `Path=/`, `HttpOnly` and `SameSite=Lax`.
- **`Secure`:** set, with the `__Secure-` name prefix, when `NUXT_AUTHENTICATION_BASE_URL` is `https://`. Production requires that; plain `http` is allowed only on loopback.
- **Values:** signed with `NUXT_AUTHENTICATION_SECRET` and opaque to the browser.

| Cookie | Purpose and contents | Lifetime | Essential? | When absent or refused |
|---|---|---|---|---|
| `authentication.session_token` | The signed-in session: a random session token, looked up in `session` | Sliding: the policy's idle timeout (1 hour by default), within the absolute lifetime (24 hours by default). Removed on sign-out | Yes: it is how a person stays signed in | Nobody can stay signed in |
| `authentication.two_factor` | The interim state between a correct password and the second factor; no session yet | 5 minutes | Yes, while MFA applies | A password sign-in cannot complete its second factor |
| `authentication.trust_device` | A remembered device that may skip the second factor | `rememberedDevice.days`. Set only when the host enables it (it is off by default) and the person opts in | No: a convenience the person chooses | The second factor is asked for every time |
| `authentication.state` | Binds a provider sign-in (state, PKCE, nonce) to this browser; the values themselves are in `verification` | 5 minutes (**unverified:** the name and lifetime are read from the engine's code, not observed in a browser) | Yes, for provider sign-in | Provider sign-in fails |
| `authentication.better-auth-passkey` | The pending WebAuthn challenge during passkey registration or sign-in (**unverified:** the name is read from the engine's code; the lifetime is not confirmed) | Short, one ceremony | Yes, for passkeys | Passkey ceremonies fail |

Break-glass enrolment sets no cookie: its challenge is held server-side (`break_glass_enrolment`). The service token endpoint sets none either.

The engine can also set `session_data`, `dont_remember` and `account_data` cookies. The layer's settings never trigger them: the cookie cache is off, and the layer never asks for a session that is not remembered. **Unverified** in a browser.

## Browser storage

None. The layer does not use `localStorage`, `sessionStorage`, IndexedDB or service-worker caches. The session state that `useAuthentication()` holds is in memory and in Nuxt's server-rendered payload, and is gone when the page is closed.

## Server stores

All of these live in the host's PostgreSQL database, in the schema `authentication` (or the name the host chooses). The database belongs to the host, the schema to the layer: only the layer reads or writes it, and it should connect as a role limited to that schema (ADR-0002). No other capability reads these tables.

The data classes used below are:

- **Personal:** identifies a person.
- **Secret:** a credential or its digest.
- **Operational:** neither.

| Table | Holds | Data class | Kept until |
|---|---|---|---|
| `user` | Account identifier, sign-in email address and whether it is verified, whether TOTP is on, times. `name` is always `''` and `image` always `null`: profile data is Profile's | Personal | The account is deleted |
| `account` | How the account signs in: a password hash (`credential`), or a provider's subject identifier. Provider tokens are stripped before they are stored | Personal; secret (the hash) | The account is deleted, or the provider is unlinked |
| `session` | Session token, expiry, user agent (full string as received; only a coarse description is ever shown), when and how it was authenticated. No IP address | Personal; secret (the token) | Signed-out or revoked: deleted at once. Expired: `retention.sessionDays` after expiry (90 by default) |
| `verification` | Pending email-verification, password-reset and provider sign-in values, with the identifier stored hashed | Secret | `retention.tokenDays` after expiry (30 by default); a used value goes at once |
| `passkey` | Public key, credential ID, name, signature counter, device type, whether backed up, transports and authenticator model (AAGUID) | Personal; public key material | Removed by the person, or the account is deleted |
| `twoFactor` | The TOTP secret, encrypted with a key from the layer's secret, and backup codes as keyed digests, with failure counts | Secret | TOTP is turned off, or the account is deleted |
| `totp_last_step` | The last TOTP time step used, to refuse a replay | Operational | The account is deleted |
| `sign_in_throttle` | Failure counts and lockouts. Keys are a SHA-256 of the email address, a SHA-256 of the service identity, or the client's **IP address in plain text** | Personal (IP address) | Until it no longer affects a decision: its window (`signInThrottle.windowSeconds`, 15 minutes by default) has passed and any lockout has ended. `runAuthenticationMaintenance` then deletes it. Account keys are also cleared on a successful sign-in |
| `credential_recovery` | Who last recovered their credentials, when, and how (`password-reset` or `backup-code`) | Personal | `retention.recoveryDays` after the recovery (365 by default), and only if the host's legal-hold port says no hold applies; or the account is deleted |
| `break_glass_account` | Which accounts are break-glass, and when they were provisioned | Operational | The account is deleted |
| `break_glass_enrolment` | An enrolment token's HMAC-SHA-256 digest, its expiry and the pending challenge | Secret | Used: deleted at once. Expired: `retention.tokenDays` after expiry |
| `service_credential` | A service identity's secret as a keyed digest, or its public key and thumbprint, with times and how it ended | Secret; public key material | `retention.tokenDays` after it is revoked or expires; or the identity is closed |
| `service_token` | A service token's keyed digest, its identity, method and times | Secret | `retention.tokenDays` after expiry; or the identity is closed |
| `service_assertion` | Each signed assertion's `jti`, used once | Operational | Its expiry (at most 5 minutes): expired rows are deleted whenever the token endpoint checks an assertion; or the identity is closed |
| `schema_migration` | Which migrations have run | Operational | Always |

Deleting an account (`deleteAuthenticationAccount`, on Identity's `identity.closed`) removes its sign-in identifier, credentials and sessions together. `runAuthenticationMaintenance`, which the host schedules, applies the periods above (*IAM retention*).

## Leaving the layer

| Where to | What | Controls |
|---|---|---|
| The host's mailer | The sign-in email address, verification and reset links, security notices | The host's mail provider is its own processor |
| The host's event sink | `AuthenticationEvent`s: principal, session, method, outcome, and the client's IP address and user agent. Never a credential, code, token or email address | The sink's owner keeps and deletes them |
| Have I Been Pwned | The first 5 characters of the password's SHA-1 hash, only when `password.compromisedCheck` is `hibp-range` (the default) | A k-anonymity range query; nothing that identifies a person (*Have I Been Pwned*) |

## Consent

The cookies and stores above exist only to sign people in and keep them signed in, at their request. `trust_device` is the only optional one, and it is set only when the person asks. Whether any of them needs consent, or qualifies for an exemption, is the host's decision for its jurisdiction (Privacy §5).
