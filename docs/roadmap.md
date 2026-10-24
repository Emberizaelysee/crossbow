# Roadmap

Milestones are in order, without dates for now. Each one ends with a release you can run, and a check by the project owner against its exit criteria. The full backlog is in GitHub issues, seeded from [.github/backlog/](../.github/backlog/).

## M0: Foundations *(this PR)*

Vision, requirements, architecture, privacy model, ADRs, GitHub templates and backlog.

**Exit:** the project owner accepts the docs and ADRs 0001 to 0008.

## M1: Shell and module host

Four time-boxed spikes first, because their results can change the plan:

| Spike | Question |
|---|---|
| **S1** footprint | What do a bare Electron 45 window and one blank tab really cost in memory, disk and start-up time on Linux? Can NFR-01 to NFR-05 be met? |
| **S2** edge reveal | Do hot-zone overlays above `WebContentsView`s work smoothly on X11, Wayland, Windows and macOS? |
| **S3** sign-in | Do Google, Microsoft and a bank accept sign-in from Crossbow? |
| **S4** fingerprint | Which signals in [privacy.md](privacy.md#the-uniform-fingerprint) can Electron make uniform, natively or with a preload? |

Then: project scaffold (electron-vite, SolidJS, pnpm, lint rules, CI), engine adapter, module host and service registry, tabs, the four edge panels, the command palette, the benchmark in CI, a first Linux AppImage.

**Exit:** a browser you can use with one workspace, where every panel works from the edges and the keyboard, and modules can be switched on and off live. Budgets measured and confirmed or revised.

## M2: Workspaces, tab groups and sharing

Sealed workspaces (FR-20 to FR-24), disposable workspaces, pinned tabs and tab groups (FR-26 to FR-28), send to workspace and the Shelf (FR-30 to FR-33), network routes including Tor (FR-23), session restore (FR-52), workspace indicator (FR-14).

**Exit:** two accounts on the same site in two workspaces, proven not to share anything except what the user sends. An end-to-end test proves it.

## M3: Privacy

Content blocker, URL cleaner, HTTPS-only, secure DNS (FR-40 to FR-43), the uniform fingerprint profile (FR-44), strict permissions (FR-45), WebRTC protection (FR-48), privacy panel (FR-46), "forget this site" (FR-49), no-request check in CI (NFR-10).

**Exit:** two clean installs on the same platform produce the same fingerprint in CreepJS and Cover Your Tracks. Results published in the release notes.

## M4: Daily driver (1.0)

History and bookmarks (FR-50), downloads (FR-51), PDF, find, zoom, print (FR-54, FR-55), tab sleeping and archiving (NFR-08, FR-29), importer (FR-53), opt-in signed updates (FR-56), packages for Linux (AppImage, deb, rpm), Windows and macOS, accessibility pass (NFR-23).

**Exit:** the project owner uses Crossbow as their only browser for two weeks, and every budget passes in CI.

## After 1.0

Peek and split view (FR-15, FR-16), routing rules (FR-25), notes and reader mode (FR-57, FR-58), a tested Chrome extension subset (FR-59), end-to-end-encrypted sync, an optional randomised fingerprint mode, Flatpak, third-party modules.
