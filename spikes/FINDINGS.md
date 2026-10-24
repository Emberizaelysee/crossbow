# M1 spike findings

- **Date:** 2026-10-24
- **Machine:** Ubuntu 24.04.5, GNOME on X11, 20 threads, 32 GB RAM, Intel Iris Xe graphics
- **Engine:** Electron 45.0.0 (Chromium 156.0.8078.48)

Raw results sit next to each spike: `results-*.json` and `results-disk.txt`.

## Summary

| Spike | Answer | What it changes |
|---|---|---|
| **S1** footprint | Disk fits. Memory doesn't: **244 MB** for the UI plus one blank tab, against a 180 MB target. That's still 27 % less than Brave and 50 % less than Firefox measured the same way. | Revise NFR-01 and NFR-04 (proposed [ADR-0009](../docs/adr/0009-revised-footprint-budgets.md)) |
| **S2** edge reveal | **Works on X11**: 15/15 checks, about one frame of latency, 0 % CPU at idle, but only with a **frameless** window. | Frameless window and zone sizing (proposed [ADR-0010](../docs/adr/0010-frameless-window-and-hot-zones.md)). Still to check: maximized on a real desktop, Wayland, Windows, macOS |
| **S3** sign-in | Google, Microsoft, GitHub, Proton and Apple sign-in pages all load with no "unsupported browser" message. | **A real sign-in is still to do (manual).** The JS and header brand lists must match first. |
| **S4** fingerprint | Native settings work and reach workers. Main-world patches work in the page but **leak in workers** and can be detected. Fonts and audio aren't covered. | **Owner decision needed** (options at the end) |

## S1: footprint (#2)

### Memory

Median of 5 runs. Each run is measured 8 s after the blank tab loads, summing PSS over every process in the tree.

| Variant | Total PSS | Private (USS) | Start → blank tab loaded |
|---|---|---|---|
| Electron, one blank tab | 230 MB | 113 MB | 167 ms |
| + Crossbow UI overlay view | **244 MB** | 116 MB | 179 ms |
| + spare renderer disabled | 244 MB | 116 MB | 177 ms |
| + Chromium low-end-device mode | 244 MB | 116 MB | 181 ms |
| + network service in the browser process | 236 MB | 109 MB | 179 ms |
| + Ghostery blocker, ads lists (cached) | 259 MB | 129 MB | 285 ms |
| + Ghostery blocker, ads + tracking (cached) | **261 MB** | 131 MB | 294 ms |
| *Brave, fresh profile, one blank tab* | *334 MB* | | |
| *Firefox 157 (snap), fresh profile, one blank tab* | *486 MB* | | |

Where the 244 MB goes: browser (main) process about 84, GPU about 47, network utility about 25, UI renderer about 29, page renderer about 29, zygotes about 30.

- Chromium's flags for a spare renderer and low-end devices make **no difference** at idle.
- Moving the network service into the main process saves 8 MB but removes a crash and security boundary. **Not worth it.**
- The blocker with EasyList and EasyPrivacy costs **+17 MB and +115 ms** once its compiled lists are cached. On a first run with no cache, it downloads and compiles them: 18 s and +190 MB on this connection. Shipping precompiled lists in the package avoids that.
- These start-up times are **warm**: the OS file cache was full. A truly cold start (`drop_caches`) needs root and wasn't measured. The 1.0 s target (NFR-05) has a wide margin anyway.

### Disk

| | Size | Target |
|---|---|---|
| Electron as shipped | 274 MB | |
| Trimmed: en-US locale only, no default app (Chromium licence file kept) | **266 MB** installed | NFR-04: 260 MB ✗ |
| Packed as squashfs, zstd level 19 (what an AppImage uses) | **107 MB** | NFR-03: 110 MB ✓ (tight) |
| Packed as squashfs, xz | 101 MB | |

The `electron` binary is 224 MB of that and is **already stripped**. Little can be trimmed beyond locales without rebuilding Electron. Crossbow's own code and the filter lists must stay under about 3 MB packed to keep the AppImage below 110 MB.

### Recommendation

Revise once, as the requirements allowed ([ADR-0009](../docs/adr/0009-revised-footprint-budgets.md)):
- **NFR-01** becomes **≤ 270 MB** with the default modules: 244 base + 17 blocker + about 10 for other modules.
- **NFR-04** becomes **≤ 275 MB** installed.
- NFR-03 (110 MB) and NFR-05 (1.0 s) stay.

## S2: edge reveal (#3)

Driven by [run.mjs](s2-edge-reveal/run.mjs) inside a nested **Xephyr** server with XTest, so the real desktop cursor was never touched.

| Check | Result |
|---|---|
| Page receives clicks at rest | ✓ |
| Brief pass over an edge (60 ms) doesn't reveal | ✓ |
| Each of the 4 edges reveals after the 150 ms delay, stays open while hovered, hides 300 ms after leaving | ✓ ×4 |
| The page outside an open panel still receives clicks | ✓ |
| Delay end → panel painted (median / max of 5) | left 17 / 19 ms · right 9 / 14 · top 18 / 29 · bottom 13 / 16 |
| CPU at idle | **0 %** with hot zones, against **1.2–5 %** for 60 Hz cursor polling |

The design works with **one** UI view and no polling. At rest, the UI view sits *under* the page, which is inset by the zone width, so only that thin frame receives the mouse. On reveal, the UI view is raised and shrunk to the panel's rectangle.

Two things the spike found:

1. **The title bar hides the top zone.** With a normal window frame, the screen's top edge is the title bar, and the top panel can never be reached. → The window must be **frameless**, with the top panel acting as the drag area.
2. **A frameless, resizable window uses its outer 5 px as invisible resize handles** (x = 0–4 measured). Hot zones narrower than 6 px never fire. → **2 px zones when maximized or full screen, 8 px when windowed.**

**Still to check:**
- **Maximized on a real desktop.** No window manager runs inside Xephyr. Check: `CB_MAXIMIZE=1 CB_RESIZABLE=1 ../node_modules/electron/dist/electron s2-edge-reveal/app.mjs`, then push the mouse to each screen edge.
- Wayland, Windows and macOS. Not available on this machine.

## S3: sign-in (#4)

Automatic part ([results-auto.json](s3-sign-in/results-auto.json)). Each page was loaded with Crossbow's planned user agent, and nothing was typed:

| Service | Page loads | "Unsupported browser" wording |
|---|---|---|
| Google | ✓ accounts.google.com | none |
| Microsoft | ✓ login.live.com | none |
| GitHub | ✓ | none |
| Proton | ✓ | none |
| Apple | ✓ | none |

Google decides whether to block an embedded browser **after the email is entered**, so this isn't the answer yet. **Manual step:**

```bash
node s3-sign-in/run.mjs manual https://accounts.google.com
```

Repeat with Microsoft and your bank. Each run uses a throwaway profile that is deleted on exit.

**Found along the way:**
- Electron's default user agent contains `Electron/45.0.0`. Crossbow must always replace it, and does.
- The JS `navigator.userAgentData` brand list contains only `Not:A-Brand`, while the spike's request headers added `Chromium`. That mismatch is itself a signal that sign-in systems may flag. The JS and header brand lists must be made identical before the manual test means anything (see S4).

## S4: fingerprint (#5)

Two fresh profiles and two window sizes per variant. Full table: [results.json](s4-fingerprint/results.json).

- **default**: Electron as is.
- **native**: settings Chromium lets us set: `TZ=UTC`, `--lang`, user agent, WebRTC IP policy, permissions denied.
- **uniform**: native plus the main-world preload ([uniform-preload.cjs](s4-fingerprint/uniform-preload.cjs)).
- **uniform-swgl**: uniform plus software WebGL (SwiftShader).

| Signal | Default (this machine) | Native settings | Main-world preload | In a **worker** |
|---|---|---|---|---|
| User agent | contains `Electron/45.0.0` | ✓ reduced Chrome UA | ✓ | ✓ native setting reaches workers |
| Client hints (JS) | full version 156.0.8078.48, x86, 64-bit | ✗ unchanged | not patched yet | — |
| Time zone | (real time zone, redacted) | ✓ UTC | ✓ | ✓ UTC |
| Languages | en-US, en | ✓ | ✓ | ✓ |
| Media devices | real device count | ✓ one of each kind once permission is denied | ✓ | — |
| WebRTC local IP | **(real LAN IP, redacted)** | ✓ replaced by a random mDNS name | ✓ | — |
| hardwareConcurrency / deviceMemory | 20 / 32 | ✗ | ✓ 4 / 8 | **✗ leaks 20 / 32** |
| Screen, available screen | real | ✗ | ✓ | — |
| Canvas | machine hash | ✗ | ✓ blanked (`toDataURL` only; `getImageData` and `toBlob` not yet) | **✗ OffscreenCanvas untouched** |
| WebGL vendor / renderer | Intel Iris Xe (Mesa) | ✗ | ✓ "Google Inc." / "ANGLE (Generic)" | **✗ leaks the real GPU** |
| WebGL parameters | machine hash | ✗ | ✗ | SwiftShader changes it to a software set; machine-independence unverified |
| Audio | machine hash | ✗ | ✗ not covered | ✗ |
| Installed fonts | 13 of 15 probed fonts detected | ✗ | ✗ not covered | ✗ |
| Patches look native (`toString`) | — | — | **✗ detectable** on all 4 patched APIs checked | — |

### What this means

- **Native settings are solid but cover little:** time zone, languages, user agent, WebRTC and media devices. They reach workers too.
- **Main-world patches cover the rest in the page but fail in three ways:**
  1. Workers see the real values, and any fingerprinting script can create a worker.
  2. The patches can be detected, which is itself a signal.
  3. Fonts and audio stay machine-specific and can't be fixed from JavaScript.
- **Whether two machines match** couldn't be checked on one machine. The next step is to run `node s4-fingerprint/run.mjs` on a second computer and compare the `results.json` files.

So, on Electron, "everyone shares one signature" is **only partly achievable**. Crossbow can remove the most identifying values (exact GPU, CPU count, RAM, time zone, local IP, device list). It can't make a careful fingerprinter see identical browsers, the way the Tor and Mullvad browsers manage with engine-level changes.

### Options for the owner

1. **Stay on Electron and harden as far as possible.** Wrap `Worker`/`SharedWorker` so the patches are injected into workers too. Patch `getImageData`, `toBlob` and OffscreenCanvas. Use SwiftShader for WebGL in the uniform profile. Restrict fonts (Linux: a fontconfig file of our own; Windows and macOS: harder). Document what remains. *Cheapest. Good protection against common trackers, not against determined fingerprinters.*
2. **Electron now, Gecko later.** Ship 1.0 on Electron with option 1. Later, add a second engine behind the existing adapter ([ADR-0001](../docs/adr/0001-electron-as-first-engine.md#revisit-when)), based on Gecko with `privacy.resistFingerprinting`, the same base as Mullvad Browser, for real uniformity. *Most realistic route to the original goal.*
3. **Switch to Gecko now.** True uniformity from the start, but brings back the heavy build and maintenance burden that ADR-0001 avoided, and pushes the daily-driver milestone far back.

**Recommendation: option 2.** It fits ADR-0001's "revisit when" clause, keeps M1 to M4 on schedule, and the adapter keeps the door open.
