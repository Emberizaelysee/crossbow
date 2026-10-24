# ADR-0003: Workspaces are sealed session partitions

- **Status:** Accepted (2026-10-24)
- **Date:** 2026-10-24
- **Requirements:** FR-20 to FR-25, FR-47, FR-48

## Context

Workspaces must be separate identities, not just visual tab groups: their own cookies, storage, permissions, history and network route, plus disposable workspaces that leave nothing behind.

## Decision

- **One Electron session per workspace.** Normal workspaces use `session.fromPath(<profile>/workspaces/<uuid>/chromium)`, which keeps Chromium's data in the workspace's own folder. Disposable workspaces use an in-memory session (`session.fromPartition("ws-<uuid>")` without `persist:`), so nothing reaches the disk.
- **Crossbow's own per-workspace data** (history, bookmarks, permissions, tabs and groups) lives in `workspaces/<uuid>/crossbow.sqlite`. Disposable workspaces keep it in memory. Deleting a workspace deletes one folder.
- **Network route per session** with `session.setProxy`: direct, an HTTP/SOCKS proxy, or the local Tor SOCKS port. WebRTC is restricted so it can't leak around the proxy (FR-48).
- **Permissions per session** with `setPermissionRequestHandler` and `setPermissionCheckHandler`, backed by the workspace database. The default answer is deny (FR-45).
- **Third-party cookies blocked** on every session (FR-47).
- **No shared caches.** The HTTP cache, DNS cache (through secure DNS), and code cache are per session, so cache timing can't link workspaces.
- **Global data** (settings, module states, Shelf) lives in `profile.sqlite`, outside any session, and can't be reached by web content.

## Alternatives

- **One session with cookie-jar switching:** fragile, and leaks through cache and storage.
- **Separate Electron processes per workspace:** stronger isolation, but each one costs the full Electron base memory, which breaks NFR-01.

## Consequences

- **Good:** isolation is enforced by Chromium itself, not by our code.
- **Good:** two Google accounts in two workspaces just work.
- **Bad:** each active session has a small memory and disk cost. Sessions of workspaces you haven't opened since start-up aren't created until you switch to them.
- **To check in M1:** whether `node:sqlite` in Electron 45's bundled Node is stable enough, or whether we need `better-sqlite3`.
