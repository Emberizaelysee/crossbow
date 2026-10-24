# ADR-0002: Every feature is a lazily loaded module

- **Status:** Proposed
- **Date:** 2026-10-24
- **Requirements:** FR-01 to FR-05, NFR-20

## Context

Users should be able to switch any feature on or off. A disabled feature should cost nothing, and any part of the browser should be replaceable without rewriting the rest.

## Decision

1. **A minimal core.** The core holds only what can't sensibly be switched off: the window, the tab and group model, workspaces and their isolation, settings, permissions, history and bookmarks, downloads, the module host and the service registry. Everything else is a module.
2. **One folder per module**, with a `manifest.ts` (id, name, description, default, scope, dependencies, services used, restart flag, measured cost, known breakage) and an `activate(ctx)` entry point that returns a `Disposable` ([architecture](../architecture/overview.md#module-system)).
3. **Lazy loading.** At start-up the host reads manifests only. Module code is loaded with a dynamic `import()` when the module is enabled. Disabled means not loaded.
4. **Everything through `ctx`.** Modules register request handlers, UI components, commands, settings and storage through the context they're given. The host tracks each registration and undoes it on disable, so most modules turn off live.
5. **No direct imports.** A module may import the public `@crossbow/api` types and its own files only, never the core's internals or another module. Modules that need each other declare `requires` and talk through services or the event bus. A lint rule enforces this (NFR-20).
6. **Global or per-workspace.** Modules declare `scope`. Per-workspace modules can be on in one workspace and off in another (FR-04).
7. **Build profiles.** A build can leave modules out entirely to save disk space (for example a minimal build without Tor). The default build includes all first-party modules.
8. **First-party only for 1.0.** Third-party modules would need a permission model and sandboxing. That's a separate decision later.

## Alternatives

- **Feature flags in one codebase:** simpler, but disabled code is still loaded, and features become tangled over time.
- **Using Chrome extensions as the module system:** familiar, but Electron's extension support is partial, and extensions can't change the browser's own interface or engine settings.
- **Separate processes per module:** strong isolation but costs memory for every module, against NFR-01.

## Consequences

- **Good:** users get real control, with costs shown per module. Disabled features cost nothing at run time. Parts can be swapped.
- **Bad:** the service interfaces must be designed carefully up front, and changing them later affects every module. They're versioned in `@crossbow/api`.
- **Bad:** the benchmark has to measure each module's cost to keep the numbers shown to users honest.
