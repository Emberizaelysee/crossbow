# M1 spikes

Time-boxed experiments that answer the questions in [docs/roadmap.md](../docs/roadmap.md#m1-shell-and-module-host) before the real code starts. **Throwaway code**: nothing here is imported by the product.

| Spike | Issue | Folder | Run |
|---|---|---|---|
| S1 footprint | #2 | [s1-footprint/](s1-footprint/) | `node s1-footprint/run.mjs` and `s1-footprint/disk.sh` |
| S2 edge reveal | #3 | [s2-edge-reveal/](s2-edge-reveal/) | `gcc -o /tmp/xtest-move s2-edge-reveal/tools/xtest-move.c -lX11 -lXtst`, then `XTEST_MOVE=/tmp/xtest-move node s2-edge-reveal/run.mjs` (needs Xephyr) |
| S3 sign-in | #4 | [s3-sign-in/](s3-sign-in/) | `node s3-sign-in/run.mjs`, then `node s3-sign-in/run.mjs manual <url>` |
| S4 fingerprint | #5 | [s4-fingerprint/](s4-fingerprint/) | `node s4-fingerprint/run.mjs` |

Setup: `pnpm install` in this folder (Electron 45.0.0, `@ghostery/adblocker-electron` 2.20.1). S1 also has `compare.mjs`, which measures installed Brave and Firefox the same way.

Findings and recommendations: [FINDINGS.md](FINDINGS.md).
