# ADR-0001: Electron as the first engine, behind an adapter

- **Status:** Proposed
- **Date:** 2026-10-24
- **Requirements:** NFR-01 to NFR-05, NFR-12, NFR-21, NFR-22

## Context

Crossbow needs a complete, compatible web engine on Linux, Windows and macOS, with strong per-workspace isolation, and it has to be usable daily soon. It also has to be as light as possible, which pulls in a different direction.

## Options considered

| Option | Isolation per workspace | Footprint | Effort to ship and maintain | Compatibility |
|---|---|---|---|---|
| **Electron (Chromium)** | Built in: session partitions, `session.fromPath` | Medium: Chromium base cost (~120–180 MB RAM idle, ~100 MB download) | Low: one npm dependency, regular releases | Excellent |
| Firefox / Gecko fork (like Zen) | Excellent (containers, resist-fingerprinting) | Similar to Firefox | Very high: multi-hour builds, tracking upstream is near full-time work | Very good |
| Chromium fork (like Brave) | Excellent | Similar to Chrome | Very high: 100 GB checkout, 4–8 h builds | Excellent |
| Tauri / system WebView | Weak on Linux (WebKitGTK), no extensions, different engines on each OS | Lowest (~5–15 MB binary) | Low | Uneven: Safari engine on macOS, WebKitGTK on Linux lags behind |
| CEF / Qt WebEngine | Good | Similar to Electron | Medium to high, smaller community | Excellent |

## Decision

Use **Electron** (currently 45.x) as the only engine for 1.0, and keep it behind an `Engine` interface ([architecture](../architecture/overview.md#engine-adapter)). Only `src/engine/electron/` may import `electron`. A lint rule enforces this (NFR-21).

Most of a browser's memory goes to the web pages themselves, and every complete engine pays that cost. Since Tauri can't give us sealed workspaces on Linux, Electron is the lightest option that meets the requirements. We keep it light by removing what we don't need, not by picking a weaker engine:

- one UI renderer for all of Crossbow's interface, with a tiny UI stack ([ADR-0006](0006-lightweight-ui-stack.md))
- sleeping tabs that destroy their renderer (NFR-02, NFR-08)
- lazy modules that load nothing when disabled ([ADR-0002](0002-modular-feature-system.md))
- only the locales the user needs packaged, no bundled DevTools extensions, ASAR packaging and compressed installers
- no Node.js native modules unless unavoidable, preferring Node's built-in `node:sqlite`

## Consequences

- **Good:** fast start, full web compatibility, sealed workspaces nearly for free, one codebase for three platforms.
- **Bad: security patch lag.** Electron releases Chromium fixes a few days after Chrome. We commit to shipping each Electron security release within 7 days (NFR-12), which requires an opt-in updater (FR-56) and CI that builds release candidates automatically.
- **Bad: some sign-ins may refuse "embedded browsers"** (Google is known to do this). Spike S3 tests sign-in to Google, Microsoft and a bank early in M1.
- **Bad: weaker fingerprint control than a Gecko or Chromium fork** ([ADR-0004](0004-uniform-fingerprint-profile.md), [privacy.md](../privacy.md#limits-honestly)).
- **Bad: extension support is partial** in Electron. Extensions are a post-1.0 module (FR-59).

## Revisit when

- Spike S1 shows the idle budget (NFR-01) can't be met and no optimisation closes the gap, or
- the fingerprint limits from spike S4 are unacceptable, or
- Electron stops shipping security releases on time.

Then evaluate a Gecko-based engine behind the same adapter.
