# Crossbow

**A privacy-first, browsing-first web browser.** The page gets the whole screen. Tabs, menus and tools stay hidden until your mouse reaches a screen edge. Your life is split into **workspaces** that are sealed from each other, and every feature is a **module** you can switch on or off.

> **Status: M0, Foundations.** There is no code yet. This repository currently holds the vision, requirements, architecture and decision records for review. See the [roadmap](docs/roadmap.md).

## What makes it different

| | |
|---|---|
| **Browsing first** | No permanent toolbars. The left edge shows workspaces and tabs, the top edge the address and command bar, the right edge the privacy panel and notes, the bottom edge downloads and status. `Ctrl+K` opens a command palette for everything. |
| **Workspaces as sealed identities** | Each workspace has its own cookies, storage, cache, permissions, network route (direct, proxy or Tor) and modules. Disposable workspaces are wiped when closed. |
| **Share without leaking** | Send a tab or link to another workspace, or drop it on the shared Shelf. Only the cleaned URL crosses over: no cookies, no referrer, no session. |
| **Tab groups** | Named, coloured, collapsible groups inside each workspace; save a group and reopen it later. |
| **One fingerprint for everyone** | By default every Crossbow user presents the same browser fingerprint, so trackers can't single you out. ([how and its limits](docs/privacy.md)) |
| **Modular** | Ad blocking, the uniform fingerprint, edge panels, tab sleeping, Tor routing… are all modules. A disabled module isn't loaded, so it costs no memory. |
| **Lightweight** | Strict memory and disk budgets, sleeping tabs, a tiny UI layer and no bundled extras ([budgets](docs/requirements.md#non-functional-requirements)). |
| **No telemetry** | Crossbow never phones home. Updates are opt-in. |

## Documentation

- [Vision](docs/vision.md): goals, principles and non-goals
- [Requirements](docs/requirements.md): functional and non-functional requirements (FR / NFR IDs)
- [Architecture overview](docs/architecture/overview.md): processes, module system, workspaces, engine adapter
- [Privacy and threat model](docs/privacy.md): what Crossbow protects against, and what it can't
- [Architecture decision records](docs/adr/): why things are the way they are
- [Roadmap](docs/roadmap.md): milestones M0 to M4 and beyond
- [Contributing](CONTRIBUTING.md) · [Security policy](SECURITY.md) · [Code of conduct](CODE_OF_CONDUCT.md)

## Licence

[Mozilla Public License 2.0](LICENSE). You can combine Crossbow with other code, but changes to Crossbow's own files must stay open.
