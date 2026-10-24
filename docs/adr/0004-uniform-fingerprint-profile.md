# ADR-0004: A uniform fingerprint, on by default

- **Status:** Accepted (2026-10-24)
- **Date:** 2026-10-24
- **Requirements:** FR-44, FR-48

## Context

Fingerprinting identifies browsers without cookies. The project owner wants every Crossbow user to share the same "digital signature" by default.

There are two known strategies:

- **Uniformity** (Tor Browser, Mullvad Browser): everyone reports the same values, so nobody stands out.
- **Randomisation** (Brave's "farbling"): every site sees different random values, so fingerprints can't be linked across sites.

## Decision

Crossbow uses **uniformity**, delivered by the `uniform-fingerprint` module, on by default. The shared values are listed in [privacy.md](../privacy.md#the-uniform-fingerprint) and versioned as a single profile file (`profiles/uniform-v1.json`). Every Crossbow user on a given platform and release gets the same profile.

Each signal is applied at the deepest level Electron allows:

1. **Native settings first:** user agent and client hints (`session.setUserAgent`, header rewriting in `onBeforeSendHeaders`), accepted languages, permission denials, WebRTC IP policy.
2. **Main-world preload second:** for values Electron doesn't expose natively (screen and window size, `hardwareConcurrency`, canvas, WebGL, audio), a small preload script runs in every frame, before the page's own scripts, and patches those APIs so the patched functions look as native as possible.
3. **Letterboxing:** the page view is sized in 200 × 100 px steps inside the window, so the window size can't be used as an identifier.

The profile is the same in every workspace. A uniform value can't link workspaces, and keeping one profile keeps the crowd large.

Users can relax the profile per site and per workspace from the privacy panel, and switch the whole module off.

## Alternatives

- **Randomisation:** easier to implement with JS patches and less likely to break sites, but it doesn't meet the owner's goal of a shared signature. It may be offered later as an alternative mode of the same module.
- **No protection, rely on blocking known fingerprinting scripts:** too weak on its own. The content blocker does this as well.

## Consequences

- **Good:** a clear, testable goal: two Crossbow installs on the same platform produce the same fingerprint hash in CreepJS and Cover Your Tracks. CI checks it.
- **Bad:** while the user base is small, "is a Crossbow user" is itself a rare signal ([privacy.md](../privacy.md#limits-honestly)).
- **Bad:** JS patches can be detected, and some signals can't be controlled from Electron at all. Spike S4 measures which signals we control, and the privacy page gets updated with the results.
- **Bad:** some sites break (canvas-based editors, WebGL apps). Per-site exceptions are needed from day one.
