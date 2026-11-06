# Resources

> **In short:** every external document this layer relies on, one row each, with the revision it was checked at. Other documents name a row here instead of linking out ([ADR-0010](https://github.com/nuxt-layers/architecture-rules/blob/11ab2da169fcccf3f2a68af2bb3ff5c95d70ce74/docs/decisions/ADR-0010-documentation-style.md)). Software dependencies follow `master` (ADR-0008) and are not listed.

**Checked** says how each row's revision was established:

- **Verified:** read at that revision for this file.
- **Carried over:** the pin earlier documents already used, not re-verified here.

## Architecture (`nuxt-layers/architecture-rules`)

All rows are verified at `11ab2da169fcccf3f2a68af2bb3ff5c95d70ce74`.

| Reference | Document | Relied on for |
|---|---|---|
| ADR-0002 | [Composition-supplied persistence and capability-owned schemas](https://github.com/nuxt-layers/architecture-rules/blob/11ab2da169fcccf3f2a68af2bb3ff5c95d70ce74/docs/decisions/ADR-0002-composition-supplied-persistence-and-capability-owned-schemas.md) | The host's pool, the layer's own schema and migrations |
| ADR-0005 | [IAM suite](https://github.com/nuxt-layers/architecture-rules/blob/11ab2da169fcccf3f2a68af2bb3ff5c95d70ce74/docs/decisions/ADR-0005-iam-suite.md) | What belongs to Authentication, Identity, Profile and Authorisation |
| ADR-0006 | [Polyglot persistence and data-store security](https://github.com/nuxt-layers/architecture-rules/blob/11ab2da169fcccf3f2a68af2bb3ff5c95d70ce74/docs/decisions/ADR-0006-polyglot-persistence-and-data-store-security.md) | Sign-in identifiers belong to Authentication (§6) |
| ADR-0007 | [Break-glass emergency access](https://github.com/nuxt-layers/architecture-rules/blob/11ab2da169fcccf3f2a68af2bb3ff5c95d70ce74/docs/decisions/ADR-0007-break-glass-emergency-access.md) | Break-glass accounts |
| ADR-0008 | [Independent layer delivery](https://github.com/nuxt-layers/architecture-rules/blob/11ab2da169fcccf3f2a68af2bb3ff5c95d70ce74/docs/decisions/ADR-0008-independent-layer-delivery.md) | Following `master`; releases suspended |
| ADR-0009 | [Headless capability layers](https://github.com/nuxt-layers/architecture-rules/blob/11ab2da169fcccf3f2a68af2bb3ff5c95d70ce74/docs/decisions/ADR-0009-headless-capability-layers.md) | The optional presentation part and the headless surface |
| ADR-0010 | [Documentation style](https://github.com/nuxt-layers/architecture-rules/blob/11ab2da169fcccf3f2a68af2bb3ff5c95d70ce74/docs/decisions/ADR-0010-documentation-style.md) | These root files and how documents are written |
| ADR-0012 | [Trivial composition](https://github.com/nuxt-layers/architecture-rules/blob/11ab2da169fcccf3f2a68af2bb3ff5c95d70ce74/docs/decisions/ADR-0012-trivial-composition.md) | `CONTRACT.md`, the composition budget and the shared shapes |
| ADR-0013 | [Development toolchain baseline](https://github.com/nuxt-layers/architecture-rules/blob/11ab2da169fcccf3f2a68af2bb3ff5c95d70ce74/docs/decisions/ADR-0013-development-toolchain-baseline.md) | Node.js 26 and pnpm 12 for development and CI |
| Architecture | [Architecture](https://github.com/nuxt-layers/architecture-rules/blob/11ab2da169fcccf3f2a68af2bb3ff5c95d70ce74/docs/architecture.md) | The capability model; the principal carries no tenant, group or role |
| Layer standard | [Layer standard](https://github.com/nuxt-layers/architecture-rules/blob/11ab2da169fcccf3f2a68af2bb3ff5c95d70ce74/docs/layer-standard.md) | Repository layout, manifest and how hosts consume a layer |
| Security | [Security](https://github.com/nuxt-layers/architecture-rules/blob/11ab2da169fcccf3f2a68af2bb3ff5c95d70ce74/docs/security.md) | The assurance baseline; recording a loosened default and its risk treatment (§12) |
| Privacy | [Privacy](https://github.com/nuxt-layers/architecture-rules/blob/11ab2da169fcccf3f2a68af2bb3ff5c95d70ce74/docs/privacy.md) | Third-party integrations (§4) and the storage register (§5) |
| Contributing | [Contributing](https://github.com/nuxt-layers/architecture-rules/blob/11ab2da169fcccf3f2a68af2bb3ff5c95d70ce74/CONTRIBUTING.md) | The AI-driven development method |
| Organisation | [`nuxt-layers`](https://github.com/nuxt-layers) | Where the other capabilities live |

## IAM suite (`nuxt-layers/iam-integration`)

All rows are carried over.

| Reference | Document | Revision | Relied on for |
|---|---|---|---|
| IAM time | [Architecture §7](https://github.com/nuxt-layers/iam-integration/blob/e986245d746507bf7093ca203e346ab1b571e3a8/docs/architecture.md#7-time) | `e986245d746507bf7093ca203e346ab1b571e3a8` | One clock for the suite |
| IAM provisioning | [Provisioning process](https://github.com/nuxt-layers/iam-integration/blob/38e06eb38c10d7415b93d5ab754a5a4a5b4cc910/docs/processes/provisioning.md) | `38e06eb38c10d7415b93d5ab754a5a4a5b4cc910` | The identity port's reference adapter |
| IAM recovery | [Recovery process](https://github.com/nuxt-layers/iam-integration/blob/38e06eb38c10d7415b93d5ab754a5a4a5b4cc910/docs/processes/recovery.md) | `38e06eb38c10d7415b93d5ab754a5a4a5b4cc910` | Identity's hold after a credential recovery |
| IAM data-subject requests | [Data-subject requests](https://github.com/nuxt-layers/iam-integration/blob/3fb6866e0b6b7abbdf599ea06df9d4b8508482f5/docs/processes/data-subject-requests.md) | `3fb6866e0b6b7abbdf599ea06df9d4b8508482f5` | `exportAuthenticationData` |
| IAM retention | [Retention process](https://github.com/nuxt-layers/iam-integration/blob/cf0c5be70e162a7a1d426298cf4f13319667caea/docs/processes/retention.md) | `cf0c5be70e162a7a1d426298cf4f13319667caea` | Retention schedules and legal holds |
| IAM service identities | [Service identities process](https://github.com/nuxt-layers/iam-integration/blob/69eb3df32eed2a62257e711243976cbc268c1b62/docs/processes/service-identities.md) | `69eb3df32eed2a62257e711243976cbc268c1b62` | Machine credentials and tokens |
| IAM adapters | [Adapters: service identities](https://github.com/nuxt-layers/iam-integration/blob/69eb3df32eed2a62257e711243976cbc268c1b62/docs/adapters.md#service-identities) | `69eb3df32eed2a62257e711243976cbc268c1b62` | The service-governance port's reference adapter |

## Theme Manager (`nuxt-layers/theme-manager`)

| Reference | Document | Revision | Checked | Relied on for |
|---|---|---|---|---|
| Semantic Presentation Guide | [Semantic Presentation Guide](https://github.com/nuxt-layers/theme-manager/blob/master/docs/semantic-presentation-guide.md) | `master` (never pinned) | Carried over | How the default pages choose and pair colour tokens |

## Standards

| Reference | Document | Revision | Relied on for |
|---|---|---|---|
| ASVS | [OWASP Application Security Verification Standard](https://owasp.org/www-project-application-security-verification-standard/) | 5.0 | Security target: Level 2, with relevant Level 3 authentication and session requirements |
| NIST 800-63 | [NIST SP 800-63B](https://pages.nist.gov/800-63-4/sp800-63b.html) | 800-63-4 | Assurance levels and authenticator terminology |
| WCAG | [Web Content Accessibility Guidelines](https://www.w3.org/TR/WCAG22/) | 2.2 | Default pages at AA |
| OAuth 2.0 | [RFC 6749](https://www.rfc-editor.org/rfc/rfc6749) | RFC 6749 | The service token endpoint (§4.4) |
| JWT client assertions | [RFC 7523](https://www.rfc-editor.org/rfc/rfc7523) | RFC 7523 | `private_key_jwt` |
| JWK thumbprint | [RFC 7638](https://www.rfc-editor.org/rfc/rfc7638) | RFC 7638 | Identifying registered public keys |
| Have I Been Pwned | [Pwned Passwords range API](https://haveibeenpwned.com/API/v3#PwnedPasswords) | v3 | The compromised-password check |
| Semantic versioning | [Semantic Versioning](https://semver.org/) | 2.0.0 | Versioning, once releases resume (ADR-0008) |
