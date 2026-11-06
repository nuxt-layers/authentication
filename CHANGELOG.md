# Changelog

All notable changes to `@nuxt-layers/authentication`, newest first. Release versions resume once the owner approves a release lifecycle (ADR-0008); until then the version is `0.0.0`.

## Unreleased

- Moved to the `nuxt-layers` organisation.
- Version reset to `0.0.0`: releases and tags are suspended (ADR-0008). The 1.0.0 entry below is history, not a supported release.
- Theme Manager follows its latest `master` instead of a pinned release commit, and hosts install Authentication from `master` (ADR-0008).
- Development and CI use Node.js 26.13.0 and pnpm 12.16.1 through Corepack (ADR-0013); hosts still need Node.js 22 or later. CI caches pnpm's store.
- Documents follow ADR-0010: `CONTRACT.md`, `RESOURCES.md`, `PLAN.md` (replacing `docs/roadmap.md`) and `STORAGE-REGISTER.md` at the root; `docs/composition-contract.md` is folded into `CONTRACT.md`.
- The layer ships its logo, served to hosts at `/authentication-logo.png`.
- The layer's own tests pass on Windows as well as on Linux and macOS: the paths they compare with import specifiers and routes are written with `/` on every platform (`tests/support/paths.ts`). On Windows the contract, architecture and endpoint tests used to fail, or check nothing.

## 1.0.0 (2026-10-11)

The first stable release: everything in contract version 1 ([docs/contracts.md](docs/contracts.md)).

- Email and password with breach checks, verification, reset, lockout and throttling; TOTP with replay protection and backup codes; passkeys and passwordless sign-in; step-up; federation with any OIDC provider, linked only explicitly. MFA is required by default.
- Sessions read with Identity's standing on every request; credential recoveries recorded before they complete.
- Break-glass accounts, service identities' client credentials and short-lived opaque tokens, and retention with legal holds.
- The accessible, localisable default pages.
