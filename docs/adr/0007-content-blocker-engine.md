# ADR-0007: Ghostery's adblocker library for content blocking

- **Status:** Accepted (2026-10-24)
- **Date:** 2026-10-24
- **Requirements:** FR-40, FR-41, NFR-01, NFR-10

## Context

Crossbow needs built-in ad and tracker blocking that understands EasyList-style filters, including cosmetic filters (hiding page elements) and scriptlets, without much memory or start-up cost.

## Options

| Option | Notes |
|---|---|
| **`@ghostery/adblocker-electron`** (MPL-2.0) | Pure TypeScript, built for Electron sessions, supports network, cosmetic and scriptlet filters, serialises compiled lists for fast start. Same licence as Crossbow. |
| Brave's `adblock-rust` | Very fast, but needs a native Node module per platform, which adds build complexity and disk size. |
| Hand-written domain block list | Light, but misses most of what EasyList does. |

## Decision

Use **`@ghostery/adblocker-electron`** inside the `content-blocker` module, attached to each workspace's session where the module is enabled.

- Filter lists: EasyList and EasyPrivacy by default. uBlock filters, regional lists and annoyance lists are optional.
- Compiled lists are stored in `filters/` and loaded from disk at start-up. They are never compiled at start-up.
- List updates come from Crossbow's own GitHub release assets, built by a scheduled CI job, so the browser contacts one documented host with no identifiers (NFR-10, [privacy.md](../privacy.md#network-requests-crossbow-itself-makes)).
- URL tracking-parameter removal is a separate `url-cleaner` module, so it also works when blocking is off.

## Consequences

- **Good:** mature, same licence, no native code.
- **Bad:** pure JavaScript matching is slower than Rust. The benchmark must confirm it fits NFR-01 and NFR-05 (S1). `adblock-rust` is the fallback, behind the same module interface.
