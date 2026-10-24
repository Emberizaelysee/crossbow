# ADR-0010: Frameless window, hot zones sized to the window state

- **Status:** Proposed
- **Date:** 2026-10-24
- **Requirements:** FR-10, FR-11, NFR-07
- **Amends:** [ADR-0005](0005-edge-reveal-interface.md) (the edge-reveal design stays, and this adds how the window and zones must be set up)

## Context

Spike S2 confirmed ADR-0005's design on X11: one UI view under the page, a thin frame of hot zones, and raising the view on reveal. Results: 15/15 checks, about one frame of latency, 0 % CPU at idle ([findings](../../spikes/FINDINGS.md#s2-edge-reveal-3)). It also found two things ADR-0005 didn't cover:

1. With a normal window frame, the screen's top edge is the title bar, so the top panel can never be reached.
2. A frameless, resizable window turns its outer 5 px into invisible resize handles, so narrower hot zones never fire.

## Decision

- Crossbow's window is **frameless** (`frame: false`) on every platform. The top panel contains the window drag area and the minimise, maximise and close buttons. On macOS, the native traffic-light buttons are kept with `titleBarStyle: "hiddenInset"`.
- Hot zone width depends on the window state:
  - **2 px when maximized or full screen.** The mouse stops at the screen edge, so a thin zone is enough.
  - **8 px when windowed**, so the zone extends beyond the resize handles.
- With `edge-reveal` turned off, the classic layout keeps the frameless window and shows the top panel permanently.

## Consequences

- **Good:** the screen's top edge works like the other edges. No polling is needed.
- **Bad:** Crossbow draws its own window controls, which must follow each platform's conventions.
- **To check before M1 ends:** maximized behaviour on a real GNOME desktop, plus Wayland, Windows and macOS. If one fails, use cursor polling at a low rate on that platform only (1.2–5 % CPU measured on X11).
