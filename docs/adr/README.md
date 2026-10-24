# Architecture decision records

Each ADR records one decision: the context, the options, what we chose and what it costs. An ADR is **Proposed** until the project owner accepts it, then **Accepted**. A changed decision gets a new ADR that marks the old one **Superseded**. Accepted ADRs aren't edited except to add that link.

| ADR | Decision | Status |
|---|---|---|
| [0001](0001-electron-as-first-engine.md) | Electron as the first engine, behind an adapter | Proposed |
| [0002](0002-modular-feature-system.md) | Every feature is a lazily loaded module | Proposed |
| [0003](0003-workspace-isolation.md) | Workspaces are sealed session partitions | Proposed |
| [0004](0004-uniform-fingerprint-profile.md) | A uniform fingerprint, on by default | Proposed |
| [0005](0005-edge-reveal-interface.md) | Edge-reveal panels over a transparent overlay | Proposed |
| [0006](0006-lightweight-ui-stack.md) | TypeScript, Vite and SolidJS for the interface | Proposed |
| [0007](0007-content-blocker-engine.md) | Ghostery's adblocker library for content blocking | Proposed |
| [0008](0008-cross-workspace-sharing.md) | Only a cleaned URL crosses between workspaces | Proposed |

New ADRs copy [template.md](template.md).
