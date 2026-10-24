# Architecture overview

This is the intended design for 1.0. It will be checked against reality by the M1 spikes, and every change to it goes through an [ADR](../adr/).

## The big picture

```
┌──────────────────────────── main process (Node.js) ─────────────────────────────┐
│                                                                                │
│  Core                                                  Modules (only if enabled) │
│  ├─ Module host ── loads / unloads ──────────────────► content-blocker          │
│  ├─ Service registry  (typed interfaces)               uniform-fingerprint      │
│  ├─ Event bus                                          url-cleaner, https-only  │
│  ├─ Workspace store  ─┐                                tab-sleep, tab-archive   │
│  ├─ Tab & group model │                                shelf, network-routes …  │
│  ├─ Settings store    │                                                         │
│  └─ Engine adapter ◄──┘  the only code that imports `electron`                  │
│        │                                                                        │
└────────┼────────────────────────────────────────────────────────────────────────┘
         │ creates
         ▼
  ┌─────────────────────┐   ┌───────────────────────┐  ┌───────────────────────┐
  │ UI renderer (1)     │   │ Page renderer          │  │ Page renderer          │
  │ edge panels, palette│   │ tab in workspace A     │  │ tab in workspace B     │
  │ SolidJS, overlay    │   │ partition persist:A    │  │ partition persist:B    │
  └─────────────────────┘   └───────────────────────┘  └───────────────────────┘
        sandboxed, context isolation, no Node.js in any renderer
```

- **One main process** runs the core and the enabled modules.
- **One UI renderer** draws all of Crossbow's own interface (edge panels, palette, settings) as a transparent overlay above the page.
- **Page renderers** come from Chromium's site isolation: one per site, more or less. Each tab is an Electron `WebContentsView` attached to its workspace's session.
- A **sleeping tab** has no renderer at all. Its `WebContentsView` is destroyed and only a small record survives (URL, title, favicon, scroll position, group). Waking it reloads the page. This is the biggest memory saving available to us ([NFR-02](../requirements.md#non-functional-requirements), [NFR-08](../requirements.md#non-functional-requirements)).

## Source layout (planned)

```
src/
  core/            # no `electron` imports allowed (lint rule, NFR-21)
    modules/       # module host, manifest validation, dependency ordering
    services/      # service registry and the public interfaces modules use
    workspaces/    # workspace store, tab and group model, session restore
    settings/
  engine/
    electron/      # the engine adapter: the only place Electron is used
  modules/
    content-blocker/
    uniform-fingerprint/
    edge-reveal/
    …              # one folder per module, each with its manifest.ts
  ui/              # the UI renderer (SolidJS), split into panel "slots"
  preload/         # tiny, audited preload scripts
```

## Module system

Full reasoning in [ADR-0002](../adr/0002-modular-feature-system.md).

Each module is a folder with a manifest and an entry point:

```ts
export const manifest = defineModule({
  id: "content-blocker",
  name: "Ad and tracker blocker",
  description: "Blocks ads and trackers with EasyList and EasyPrivacy.",
  defaultEnabled: true,
  scope: "workspace",          // "global" | "workspace": can it differ per workspace?
  requires: [],                // other module ids
  services: ["network", "settings", "ui.panel"],   // core services it may use
  restartRequired: false,
  cost: { memoryMB: 20, startupMs: 40 },  // measured by the benchmark, shown in Settings
  breaks: "Some sites detect blockers and refuse to load.",
});

export function activate(ctx: ModuleContext): Disposable { … }
```

- **Lazy loading.** The module host reads only manifests at start-up. A module's code is `import()`ed only when it's enabled, so a disabled module costs no memory and no start-up time ([FR-02](../requirements.md#core-and-modules)).
- **Clean unload.** `activate` returns a `Disposable`. Everything a module registers (request handlers, UI slots, commands, timers) goes through `ctx`, which tracks it and undoes it on disable. This lets most modules be switched on and off without a restart.
- **Only through services.** Modules get core services (network hooks, tabs, workspaces, settings, UI slots, commands, storage) from `ctx`, and can't import the core or each other directly (lint rule, [NFR-20](../requirements.md#non-functional-requirements)). This is what makes any module replaceable.
- **Per-workspace scope.** A module with `scope: "workspace"` receives the workspace in its hooks, and the host skips it in workspaces where it's turned off ([FR-04](../requirements.md#core-and-modules)).
- **UI slots.** The UI renderer exposes named slots (`edge.left.top`, `edge.right`, `palette.commands`, `settings.module.<id>`…). A module's UI is a lazily loaded component registered into a slot.
- **First-party only in 1.0.** Modules are bundled and reviewed. Disk space can still be saved at build time: a build profile can leave modules out entirely (for example a "minimal" build without Tor support).

## Engine adapter

The core talks to an `Engine` interface, not to Electron:

```ts
interface Engine {
  createSession(workspace: WorkspaceId, opts: { persistent: boolean; route: NetworkRoute }): EngineSession;
  createView(session: EngineSession, url: string): EngineView;
  onBeforeRequest(session: EngineSession, handler: RequestHandler): Disposable;
  // … headers, permissions, downloads, find-in-page, printing
}
```

The Electron adapter is the only implementation for now ([ADR-0001](../adr/0001-electron-as-first-engine.md)). If we ever move to a Gecko- or CEF-based engine, only `src/engine/` changes.

## Workspaces

Full reasoning in [ADR-0003](../adr/0003-workspace-isolation.md).

- Each workspace maps to its own Electron session **partition**: `persist:ws-<uuid>` for normal workspaces, a non-persistent partition for disposable ones. Chromium keeps cookies, storage, cache, service workers and HTTP auth separate per partition.
- Crossbow's own per-workspace data (history, bookmarks, permissions, tab and group layout) lives in one SQLite file per workspace, next to that partition's Chromium data. Deleting a workspace deletes one folder.
- A workspace's **network route** (direct, proxy, or Tor's local SOCKS port) is set on its session with `session.setProxy`, so routes never mix.
- Global data that belongs to no workspace (settings, module states, the Shelf) lives in a separate `profile.sqlite`, which no web content can reach.

## Tabs and tab groups

```
Workspace
 ├─ Pinned tabs
 └─ Tab tree
     ├─ Tab
     ├─ Group "Research" (colour, collapsed?)
     │   ├─ Tab
     │   └─ Tab
     └─ Tab
```

Groups are a core model, so modules (archive, sleep, palette) can all see them. A saved group is written to the workspace database and its tabs are closed, freeing their memory.

## Sharing between workspaces

Full reasoning in [ADR-0008](../adr/0008-cross-workspace-sharing.md).

```
 Workspace A                    core (main process)                 Workspace B
 tab ── "send to B" ─────► url-cleaner strips tracking params ───► new tab, loadURL(url)
                           token check warns about ?session= etc.   no referrer, no opener,
                           (nothing but the URL string moves)       B's own cookies only
```

The Shelf works the same way, with the URL stored in `profile.sqlite` until it's picked up or expires.

## Edge reveal

Full reasoning in [ADR-0005](../adr/0005-edge-reveal-interface.md). The UI overlay normally covers only thin **hot zones** (a few pixels) along each edge, so the page receives every other mouse event. When the cursor stays in a hot zone for the reveal delay, the overlay grows to the panel's size, and it shrinks back when the cursor leaves. Whether this works smoothly with stacked `WebContentsView`s on all three platforms is spike S2 in M1.

## Privacy pipeline

For each request: content-blocker → url-cleaner → https-only → (route) → network. For each page, before any page script runs: uniform-fingerprint's preload sets up the shared profile in the page's main world ([ADR-0004](../adr/0004-uniform-fingerprint-profile.md)). The privacy-panel module only listens to events the other modules publish on the bus, so it costs nothing when its panel is closed.

## Storage on disk

```
~/.config/crossbow/            (platform equivalent on Windows and macOS)
  profile.sqlite               settings, module states, Shelf
  workspaces/<uuid>/
    crossbow.sqlite            history, bookmarks, permissions, tabs and groups
    Partitions/…               Chromium's own data for this workspace
  filters/                     content-blocker filter lists (compiled)
```
