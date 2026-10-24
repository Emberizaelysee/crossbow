# Requirements

IDs are stable. Issues, PRs and ADRs refer to them (for example `FR-12`). **Module** says which module delivers the requirement; `core` means it can't be switched off. **Default** says whether the module is on for a new install.

Priorities: **Must** (needed for 1.0), **Should** (wanted for 1.0, may slip), **Could** (after 1.0).

## Functional requirements

### Core and modules

| ID | Requirement | Module | Default | Priority |
|---|---|---|---|---|
| FR-01 | Every feature below except `core` is a module the user can enable or disable from Settings → Modules and from the command palette. | core | n/a | Must |
| FR-02 | A disabled module isn't loaded: none of its code runs and it uses no memory. Modules that need a restart to change state say so before the switch. | core | n/a | Must |
| FR-03 | Each module shows its name, a plain-language description, what it costs (memory and startup estimate) and what it may break (site compatibility). | core | n/a | Must |
| FR-04 | Modules can be enabled per workspace when it makes sense (for example ad blocking off in one workspace only). | core | n/a | Should |
| FR-05 | Settings and module states can be exported to and imported from a single file. | core | n/a | Should |

### Browsing-first interface

| ID | Requirement | Module | Default | Priority |
|---|---|---|---|---|
| FR-10 | The page fills the window. No toolbar is shown permanently. | core | n/a | Must |
| FR-11 | Moving the mouse to an edge, after a short delay (default 150 ms, configurable), reveals that edge's panel: **left** workspaces and tabs, **top** address and command bar, **right** privacy panel and notes, **bottom** downloads and status. Each panel hides when the mouse leaves it. | `edge-reveal` | on | Must |
| FR-12 | Every panel can be opened, pinned open or closed from the keyboard. With `edge-reveal` off, the panels behave as a classic fixed sidebar and toolbar. | core | n/a | Must |
| FR-13 | `Ctrl+K` opens a command palette that searches tabs, history, bookmarks, workspaces, commands and module toggles. | `command-palette` | on | Must |
| FR-14 | A thin coloured line along one screen edge shows the current workspace's colour. | `workspace-indicator` | on | Should |
| FR-15 | Peek: open a link in a floating preview without creating a tab. | `peek` | off | Could |
| FR-16 | Split view: two tabs side by side in one window. | `split-view` | off | Could |

### Workspaces

| ID | Requirement | Module | Default | Priority |
|---|---|---|---|---|
| FR-20 | The user can create, rename, recolour, give an icon to, reorder and delete workspaces, and switch between them with a click, `Ctrl+1…9` or the palette. | core | n/a | Must |
| FR-21 | Each workspace has its own cookies, local storage, IndexedDB, cache, service workers, site permissions, history and bookmarks. Nothing is shared between workspaces unless the user shares it ([FR-30](#sharing-between-workspaces)). | core | n/a | Must |
| FR-22 | A disposable workspace keeps its data in memory only. Closing it erases everything. | core | n/a | Must |
| FR-23 | Each workspace can choose its network route: direct, an HTTP/SOCKS proxy, or Tor through a local Tor service. | `network-routes` | on | Should |
| FR-24 | Each workspace can choose its default search engine and its own set of enabled modules ([FR-04](#core-and-modules)). | core | n/a | Should |
| FR-25 | Routing rules: links to chosen sites always open in a chosen workspace (for example `*.mycompany.com` → Work). | `routing-rules` | off | Should |

### Tabs and tab groups

| ID | Requirement | Module | Default | Priority |
|---|---|---|---|---|
| FR-26 | Each workspace has pinned tabs (always kept) and regular tabs, shown as a vertical list. | core | n/a | Must |
| FR-27 | Inside a workspace, tabs can be put into named, coloured, collapsible **tab groups**. Tabs can be dragged between groups, and a group can be closed as a whole. | core | n/a | Must |
| FR-28 | A tab group can be saved and closed, then reopened later with all its tabs. | core | n/a | Should |
| FR-29 | Tabs not visited for a set time (default 12 hours) are archived automatically. Archived tabs can be searched and restored. | `tab-archive` | on | Should |

### Sharing between workspaces

| ID | Requirement | Module | Default | Priority |
|---|---|---|---|---|
| FR-30 | "Send to workspace" (context menu, drag a tab onto a workspace, or the palette) opens the tab's URL in the target workspace. Only the URL is passed: no cookies, storage, session, referrer or opener. | core | n/a | Must |
| FR-31 | Before a URL crosses workspaces, tracking parameters are removed, and the user is warned if the URL looks like it carries a login or session token. | core | n/a | Must |
| FR-32 | The **Shelf** is a list of links, visible from every workspace, where the user can drop links and pick them up later in any workspace. Shelf items expire after a set time (default 7 days). | `shelf` | on | Should |
| FR-33 | Selected text or a link can be "copied to workspace" without going through the system clipboard. | `shelf` | on | Could |

### Privacy

| ID | Requirement | Module | Default | Priority |
|---|---|---|---|---|
| FR-40 | Built-in ad and tracker blocking with EasyList and EasyPrivacy filter lists, updated by Crossbow without contacting any other service. | `content-blocker` | on | Must |
| FR-41 | Known tracking parameters (`utm_*`, `fbclid`, `gclid`…) are removed from URLs on navigation. | `url-cleaner` | on | Must |
| FR-42 | HTTPS-only mode: plain-HTTP pages show an interstitial before loading. | `https-only` | on | Must |
| FR-43 | DNS over HTTPS with a selectable provider, or the system resolver. | `secure-dns` | on | Should |
| FR-44 | **Uniform fingerprint**: every Crossbow user on the same platform presents the same fingerprint ([privacy.md](privacy.md#the-uniform-fingerprint), [ADR-0004](adr/0004-uniform-fingerprint-profile.md)). | `uniform-fingerprint` | on | Must |
| FR-45 | Strict permission defaults: camera, microphone, location, notifications, clipboard read, USB, Bluetooth and similar are denied unless the user allows them per site and per workspace. | core | n/a | Must |
| FR-46 | The right-edge privacy panel shows, for the current page: blocked requests, third-party domains contacted, permissions used, fingerprinting attempts seen, and the active network route. | `privacy-panel` | on | Should |
| FR-47 | Third-party cookies are blocked in every workspace. | core | n/a | Must |
| FR-48 | WebRTC can't reveal the user's local or real IP address (on proxy and Tor routes, WebRTC is off). | core | n/a | Must |
| FR-49 | "Forget this site": erase one site's data in the current workspace. | core | n/a | Should |

### Daily use

| ID | Requirement | Module | Default | Priority |
|---|---|---|---|---|
| FR-50 | History and bookmarks per workspace, searchable from the palette. | core | n/a | Must |
| FR-51 | Downloads panel on the bottom edge, with an "ask where to save" option. | core | n/a | Must |
| FR-52 | Session restore: workspaces, tabs, groups and scroll positions come back after a restart or crash. Disposable workspaces never do. | core | n/a | Must |
| FR-53 | Import bookmarks from Firefox, Chrome and HTML bookmark files into a chosen workspace. | `importer` | off | Should |
| FR-54 | Built-in PDF viewer. | core | n/a | Must |
| FR-55 | Find in page, zoom per site, full screen, print. | core | n/a | Must |
| FR-56 | Opt-in automatic updates with signed packages ([ADR-0001](adr/0001-electron-as-first-engine.md#consequences)). | `updater` | asked at first run | Must |
| FR-57 | Per-workspace notes panel on the right edge, stored locally. | `notes` | off | Could |
| FR-58 | Reader mode. | `reader` | off | Could |
| FR-59 | A tested subset of Chrome extensions, enabled per workspace. | `extensions` | off | Could |

## Non-functional requirements

The budgets are measured on the reference machine (Linux x86-64) by an automated benchmark in CI from M1 on: PSS summed over Crossbow's whole process tree. A PR that breaks a budget needs an ADR to change it. NFR-01 and NFR-04 were revised once after spike S1 measured the real Electron baseline ([ADR-0009](adr/0009-revised-footprint-budgets.md)).

| ID | Requirement | Target |
|---|---|---|
| NFR-01 | Memory with the interface and one blank tab, default modules on | ≤ 270 MB total PSS across processes ([ADR-0009](adr/0009-revised-footprint-budgets.md)) |
| NFR-02 | Extra memory per sleeping tab | ≤ 1 MB (only its title, URL, favicon and scroll position are kept) |
| NFR-03 | Installer size (Linux AppImage) | ≤ 110 MB |
| NFR-04 | Installed size | ≤ 275 MB ([ADR-0009](adr/0009-revised-footprint-budgets.md)) |
| NFR-05 | Cold start to an interactive blank page | ≤ 1.0 s |
| NFR-06 | Interface size: the chrome UI's own JavaScript and CSS | ≤ 150 KB minified, before compression |
| NFR-07 | Edge panel opens within 16 ms (one frame) of the reveal delay ending | measured |
| NFR-08 | Tabs sleep after a set idle time (default 30 min) and under memory pressure. Sleeping is a module (`tab-sleep`, on by default). | — |
| NFR-10 | No network request on start-up or at idle except ones the user enabled (updates, filter-list refresh, secure DNS) | verified in CI |
| NFR-11 | No telemetry, crash reporting or analytics of any kind | — |
| NFR-12 | Electron security releases are shipped within 7 days | — |
| NFR-13 | Every page runs in a sandboxed renderer with context isolation. Node.js is never exposed to web content. | — |
| NFR-20 | Modules depend on the core's public interfaces only, never on each other's internals ([ADR-0002](adr/0002-modular-feature-system.md)) | checked by a lint rule |
| NFR-21 | The core never calls Electron directly outside the engine adapter ([ADR-0001](adr/0001-electron-as-first-engine.md), [architecture](architecture/overview.md#engine-adapter)) | checked by a lint rule |
| NFR-22 | Linux (x86-64, arm64), Windows 10+ and macOS 12+ | — |
| NFR-23 | Keyboard access to every feature, and screen reader labels on every control | — |
