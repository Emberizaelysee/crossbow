# Privacy and threat model

This page says what Crossbow protects you against, how, and **what it doesn't do**. If something here turns out to be wrong, we fix the code or fix this page, never just the marketing.

## Who we defend against

| Adversary | Example | Crossbow's answer |
|---|---|---|
| **Cross-site trackers** | Ad networks and analytics following you from site to site | Content blocker, third-party cookie blocking, URL cleaning, uniform fingerprint |
| **Cross-context linking** | A site linking your work identity to your personal one | Sealed workspaces: separate storage, separate fingerprint session, separate network route |
| **Fingerprinters** | Scripts that identify your browser without cookies | Uniform fingerprint profile (below) |
| **Network observers** | Public Wi-Fi, your ISP | HTTPS-only, secure DNS, optional proxy or Tor route per workspace |
| **The browser vendor** | Telemetry, crash reports, "usage statistics" | None exist. No request leaves Crossbow unless you enabled the feature that makes it (NFR-10). |
| **Someone with your unlocked computer** | Reading history | Disposable workspaces leave nothing on disk. OS-level disk encryption is your best defence; Crossbow doesn't add its own. |

## Out of scope

Crossbow **doesn't** protect against:

- **Targeted attackers or states.** If your safety depends on anonymity, use the [Tor Browser](https://www.torproject.org/). Crossbow's Tor route sends traffic through Tor, but the browser around it is not the Tor Browser and is easier to tell apart.
- **Malware on your computer.**
- **Sites you sign in to.** Logging in tells the site who you are. Workspaces only stop that knowledge spreading to other contexts.
- **Engine security bugs** before the fix ships. Electron ships Chromium fixes a little after Chrome does. We commit to releasing within 7 days of an Electron security release (NFR-12).

## The uniform fingerprint

**Goal:** by default, every Crossbow user on the same operating system looks the same to a website, so a fingerprint can't single anyone out. This is the Tor Browser and Mullvad Browser approach ("everyone looks alike"), not Brave's ("everyone looks random"). Module `uniform-fingerprint`, on by default (FR-44). Reasoning in [ADR-0004](adr/0004-uniform-fingerprint-profile.md).

### What gets made uniform

| Signal | Uniform value |
|---|---|
| User agent and client hints | Chromium's reduced user agent for the matching stable Chrome version. Brand list, platform and "mobile" only. No full version, model or architecture details. |
| Languages | `en-US, en` (user can choose another shared preset) |
| Time zone | `UTC` (optional, off by default because it changes the times sites show you) |
| Screen and window size | Window size reported in steps of 200 × 100 px ("letterboxing"). Screen size reported as the window size. |
| `devicePixelRatio`, colour depth | Fixed common values |
| `hardwareConcurrency`, `deviceMemory` | `4`, `8` |
| Canvas, WebGL, audio read-back | Uniform result: reads return the same output for everyone, or are blocked until the site is allowed |
| WebGL vendor and renderer | One generic value |
| Fonts | Local font access API blocked. CSS font fallback restricted to a bundled set where the platform allows it |
| Media devices, battery, gamepads, sensors | Empty or blocked |
| WebRTC | No local IP addresses exposed (FR-48) |

### Limits, honestly

- **"Crossbow user" is itself a signal.** A site can tell you use Crossbow. While we have few users, that group is small, which is less private than blending into Chrome's crowd. Uniformity gets stronger as more people use Crossbow.
- **The operating system can't be hidden.** Lying about it breaks too many sites and is easy to detect. Uniformity is per platform: Linux users look like each other, Windows users like each other.
- **JavaScript patches can be detected.** On Electron, much of the profile is applied by a preload script that changes browser APIs before the page runs. A determined script can notice that, which is a signal too. Values Chromium lets us set natively (user agent, client hints, languages) are set natively.
- **Not everything can be controlled from Electron.** Some signals (exact font rendering, GPU timing, the TLS handshake) come from deep inside Chromium. Spike S4 in M1 measures exactly what we can and can't make uniform. This table will be updated with the results.
- **Performance and compatibility.** Some sites break with blocked canvas reads or letterboxing. The privacy panel lets you relax the profile per site and per workspace, and says what you give up.

We will publish the results of [EFF Cover Your Tracks](https://coveryourtracks.eff.org/) and [CreepJS](https://abrahamjuliot.github.io/creepjs/) for each release.

## Workspaces and privacy

- **Separate storage:** each workspace has its own cookies, storage, cache and service workers.
- **Fingerprint:** the same uniform profile in every workspace. Because it's uniform, it can't be used to link workspaces.
- **Network:** each workspace can use its own route, so sites see different IP addresses.
- **Sharing:** only a cleaned URL ever moves between workspaces (FR-30, FR-31). Clicking a shared link in another workspace is still a choice that can link the two, so Crossbow warns when a URL looks like it carries a session or login token.

## Network requests Crossbow itself makes

Everything here is listed in Settings → Privacy, with a switch:

| Request | When | Default |
|---|---|---|
| Filter list updates | Once a day, from Crossbow's own release assets, no identifiers | on (content-blocker) |
| Update check | Once a day | asked at first run |
| Secure DNS lookups | On navigation | on, provider chosen at first run |
| Search suggestions | While typing in the address bar | **off** |

Nothing else. CI checks this list against the requests Crossbow actually makes at start-up and at idle (NFR-10).
