# Vision

## One sentence

Crossbow is a lightweight desktop browser that gives the page the whole screen, keeps each part of your life in its own sealed workspace, makes you look like every other Crossbow user, and lets you switch off anything you don't want.

## Who it is for

- **People who live in the browser** and want Arc-style workspaces, but on Linux, Windows and macOS, as open source, and without an account.
- **Privacy-conscious users** who want strong defaults without editing hundreds of settings or installing extensions.
- **People on modest hardware** who want a browser that doesn't eat their RAM.

## Principles

These settle disagreements. When two requirements conflict, the higher principle wins.

1. **Private by default.** The default settings are the private ones. No telemetry, no account, no cloud. Anything that leaves the machine is opt-in and explained.
2. **The user is in control.** Every feature is a module the user can turn off. Crossbow explains what a module does and what it costs (memory, compatibility) before you switch it on or off.
3. **Light by design.** A feature has to fit the memory and disk budgets. If it doesn't fit, it ships as an optional module that is off by default, or it doesn't ship.
4. **Browsing first.** The page owns the screen. Interface elements appear when asked for and disappear when not needed. Everything can also be reached from the keyboard.
5. **Honest about limits.** We document what each protection does not cover ([privacy.md](privacy.md)). We never market a protection we can't deliver.
6. **Replaceable parts.** The core only talks to modules and to the web engine through interfaces, so any part can be rewritten, or the engine swapped, without touching the rest.

## Goals for 1.0

- Usable as a daily browser for the project owner on Linux, with Windows and macOS builds.
- Every feature in the [requirements](requirements.md) is a module, except the core.
- Meets the performance budgets in [NFR-01 to NFR-05](requirements.md#non-functional-requirements), measured in CI.
- Passes common fingerprinting tests (EFF Cover Your Tracks, CreepJS) with the uniform profile on: no unique values beyond the documented limits.

## Non-goals (for now)

- **Building our own web engine.** We use Chromium through Electron ([ADR-0001](adr/0001-electron-as-first-engine.md)).
- **Matching the Tor Browser's anonymity.** Crossbow reduces tracking. It does not protect people whose safety depends on staying anonymous. They should use the Tor Browser.
- **Mobile versions.**
- **Cloud features, accounts or AI assistants.** An optional end-to-end-encrypted sync may come after 1.0.
- **Third-party modules** written by others. 1.0 ships first-party modules only. A safe module API for others is a later goal ([ADR-0002](adr/0002-modular-feature-system.md)).
- **Full Chrome Web Store support.** A tested subset of extensions comes after 1.0.
