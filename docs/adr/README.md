# Architecture decision records

Each ADR records one decision: the context, the options, what we chose and what it costs. An ADR is **Proposed** until the project owner accepts it, then **Accepted**. A changed decision gets a new ADR that marks the old one **Superseded**. Accepted ADRs aren't edited except to add that link.

| ADR | Decision | Status |
|---|---|---|
| [0001](0001-electron-as-first-engine.md) | Electron as the first engine, behind an adapter | Accepted |
| [0002](0002-modular-feature-system.md) | Every feature is a lazily loaded module | Accepted |
| [0003](0003-workspace-isolation.md) | Workspaces are sealed session partitions | Accepted |
| [0004](0004-uniform-fingerprint-profile.md) | A uniform fingerprint, on by default | Accepted |
| [0005](0005-edge-reveal-interface.md) | Edge-reveal panels over a transparent overlay | Accepted |
| [0006](0006-lightweight-ui-stack.md) | TypeScript, Vite and SolidJS for the interface | Accepted |
| [0007](0007-content-blocker-engine.md) | Ghostery's adblocker library for content blocking | Accepted |
| [0008](0008-cross-workspace-sharing.md) | Only a cleaned URL crosses between workspaces | Accepted |
| [0009](0009-revised-footprint-budgets.md) | Footprint budgets revised from S1 measurements | Proposed |
| [0010](0010-frameless-window-and-hot-zones.md) | Frameless window, hot zones sized to the window state | Proposed (amends 0005) |

New ADRs copy [template.md](template.md).
