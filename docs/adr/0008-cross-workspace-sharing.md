# ADR-0008: Only a cleaned URL crosses between workspaces

- **Status:** Accepted (2026-10-24)
- **Date:** 2026-10-24
- **Requirements:** FR-30 to FR-33, FR-41

## Context

Users want to move tabs and links between workspaces easily, without breaking the separation that makes workspaces useful.

## Decision

- **What moves:** the URL string only. Never cookies, storage, history, session state, form data, the referrer or a `window.opener` link.
- **Cleaning before moving:** the URL goes through the URL cleaner's tracking-parameter rules (even if the `url-cleaner` module is off for browsing), and through a token check that warns when the query or fragment looks like a session, login or one-time token (`token=`, `session=`, `code=`, `sig=`, long random values…). The user can send anyway, send without the flagged parts, or cancel.
- **Ways to share:**
  - **Send to workspace:** right-click a tab or link, drag a tab onto a workspace in the left panel, or use the palette. The tab can be moved (closed here) or copied (kept here).
  - **Shelf** (`shelf` module): a global list of links shown in every workspace's left panel. Items are stored in `profile.sqlite`, outside every session, and expire after 7 days by default.
  - **Copy to workspace:** selected text or a link goes into a workspace's Shelf entry without touching the system clipboard, which other apps can read.
- **Opening on the other side:** the target workspace opens the URL as a fresh top-level navigation in its own session, exactly as if the user had typed it.

## Consequences

- **Good:** sharing is a single action, and the guarantee is easy to state and test: an end-to-end test checks that no cookie, referrer or opener crosses over.
- **Bad:** moving a tab doesn't move its state. A half-filled form or a logged-in page arrives as a fresh page, logged in only if the target workspace is logged in. That's the point, and the UI says so the first time.
