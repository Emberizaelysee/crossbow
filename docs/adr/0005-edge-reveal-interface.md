# ADR-0005: Edge-reveal panels over a transparent overlay

- **Status:** Proposed
- **Date:** 2026-10-24
- **Requirements:** FR-10 to FR-14, NFR-07, NFR-23

## Context

The page must fill the window. Tabs, the address bar and tools appear when the mouse reaches a screen edge. In Electron, each tab is a `WebContentsView`, and a page view swallows every mouse event over its area, so Crossbow's UI never sees the mouse arrive at an edge.

## Decision

- **One UI overlay view** (the UI renderer) is stacked above the page view, with a transparent background.
- **Hot zones.** At rest, the overlay's bounds cover only thin strips along the edges (default 4 px, configurable). The page receives all other mouse events.
- **Reveal.** When the cursor stays in a hot zone for the reveal delay (default 150 ms), the overlay grows to cover that edge's panel and draws it. When the cursor leaves the panel, it hides after a short grace period (default 300 ms), and the overlay shrinks back to the hot zones.
- **Panels float over the page** by default, so revealing them doesn't make the page reflow. "Pin panel" switches that panel to taking up space beside the page.
- **Keyboard and palette** reach every panel (`Ctrl+L` address bar, `Ctrl+Shift+S` sidebar, `Ctrl+K` palette) so the mouse is never required (NFR-23).
- **Full-screen video and games:** hot zones turn off in HTML full screen, so only `Esc` brings the UI back.
- The behaviour lives in the `edge-reveal` module. With it disabled, the panels are drawn as a classic fixed sidebar and toolbar (FR-12).

## Alternatives

- **Polling the cursor position** from the main process (`screen.getCursorScreenPoint`): works everywhere, but costs CPU even at idle and adds latency.
- **Listening for mouse moves inside every page** through a preload: adds code to every page and is visible to page scripts, against the privacy goals.

## Consequences

- **Good:** zero cost at idle. The page owns almost all of the window.
- **Risk:** stacking order, transparency and resizing views may behave differently on Linux (X11 and Wayland), Windows and macOS. Spike S2 in M1 checks this on all three. Polling is the fallback if hot zones fail on a platform.
- **Bad:** a page's own content in the outer 4 px (for example scrollbars on the right edge) can be harder to reach. The right hot zone sits outside the scrollbar, and the zone width is configurable.
