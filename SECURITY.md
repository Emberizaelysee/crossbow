# Security Policy

Crossbow is a web browser whose main promise is privacy, so a leak between workspaces or to a third party is a security bug.

## Supported versions

There are no releases yet. Once 1.0 is out, only the latest release receives security fixes. Electron security releases are shipped within 7 days (NFR-12 in [docs/requirements.md](docs/requirements.md)).

## Reporting a vulnerability

**Please don't open a public issue.** Use GitHub's [private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability) on this repository (Security tab → "Report a vulnerability").

Include what you found, how to reproduce it, and its impact. You can expect an acknowledgement within 7 days and a status update within 30 days.

## Scope

Of particular interest:

- data crossing between workspaces (cookies, storage, cache, referrer, opener, timing);
- traffic leaving a workspace's network route (proxy or Tor bypass, WebRTC or DNS leaks);
- Crossbow making network requests not listed in [docs/privacy.md](docs/privacy.md);
- a fingerprint signal that differs between two Crossbow installs on the same platform while the uniform profile is on;
- web content reaching Node.js, the main process, or another module's data;
- a disabled module still running code.

Bugs in Chromium itself should be reported to the [Chromium project](https://www.chromium.org/Home/chromium-security/reporting-security-bugs/), and in Electron to [Electron](https://github.com/electron/electron/security/policy).
