# ADR-0006: TypeScript, Vite and SolidJS for the interface

- **Status:** Proposed
- **Date:** 2026-10-24
- **Requirements:** NFR-01, NFR-05, NFR-06

## Context

All of Crossbow's own interface runs in a single UI renderer that stays alive the whole time, so its memory and start-up cost count against every budget. The brainstorm assumed React. The new "as light as possible" requirement changes that.

## Decision

- **TypeScript** everywhere, in strict mode.
- **SolidJS** for the interface: about 7 KB, no virtual DOM, fine-grained updates. Faster and lighter than React (about 45 KB with React DOM) for an interface that changes often (tab lists, panels).
- **Plain CSS** with custom properties for theming. No CSS framework.
- **electron-vite** to build main, preload and UI bundles, with module code split so each module's UI is loaded only when enabled.
- **pnpm** for dependencies. Every runtime dependency needs a reason in its PR: we'd rather write 50 lines than add a package.
- **Tests:** Vitest for units, Playwright (Electron mode) for end-to-end tests, plus a benchmark script that measures NFR-01 to NFR-06 in CI.

## Alternatives

- **React:** bigger ecosystem, but larger and slower for this use. Rejected.
- **Svelte:** also light. Solid was preferred for its plain-TypeScript components and predictable reactivity.
- **No framework (vanilla or Lit):** lightest, but the tab tree, palette and settings would be slower to build and harder to maintain.

## Consequences

- **Good:** an interface budget of 150 KB is realistic (NFR-06).
- **Bad:** fewer ready-made components than React. We build our own small set.
