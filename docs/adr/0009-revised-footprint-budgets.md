# ADR-0009: Footprint budgets revised from S1 measurements

- **Status:** Proposed
- **Date:** 2026-10-24
- **Requirements:** NFR-01, NFR-03, NFR-04, NFR-05
- **Amends:** the budgets in [requirements.md](../requirements.md#non-functional-requirements) (allowed once by that page, after spike S1)

## Context

The first budgets were estimates. Spike S1 measured Electron 45 on the reference Linux machine ([findings](../../spikes/FINDINGS.md#s1-footprint-2)):

- The UI overlay plus one blank tab uses **244 MB** PSS. The ad blocker adds 17 MB once its lists are cached.
- Chromium's spare-renderer and low-end-device flags make no difference at idle.
- Moving the network service into the main process saves 8 MB but removes a process boundary.
- Trimmed Electron is **266 MB** installed and **101–107 MB** as an AppImage. The 224 MB binary is already stripped.
- Brave (334 MB) and Firefox (486 MB) use more, measured the same way.

180 MB and 260 MB can't be met without rebuilding Electron.

## Decision

| ID | Before | After |
|---|---|---|
| NFR-01 | ≤ 180 MB | **≤ 270 MB** total PSS, UI plus one blank tab, default modules on |
| NFR-03 | ≤ 110 MB | unchanged (Crossbow's code and filter lists must stay under about 3 MB packed) |
| NFR-04 | ≤ 260 MB | **≤ 275 MB** installed |
| NFR-05 | ≤ 1.0 s | unchanged (180 ms warm measured) |

The benchmark measures PSS summed over Crossbow's whole process tree, as S1 did. The network service stays in its own process.

## Consequences

- **Good:** realistic budgets backed by a measurement script, still well below mainstream browsers.
- **Bad:** about 245 MB is fixed Electron cost that no module can reduce. Savings now come from sleeping tabs, lazy modules and keeping the main process small.
- **Revisit** if a future Electron release changes the baseline by more than 10 % either way.
