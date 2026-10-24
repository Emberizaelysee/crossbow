// Automatic part of S3: load each sign-in page and look for "unsupported
// browser" wording. It never types anything. The real sign-in is manual:
//   node run.mjs                     # automatic check
//   node run.mjs manual <url>        # open one page and sign in yourself
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const electron = createRequire(import.meta.url)("electron");
const sites = {
  google: "https://accounts.google.com/",
  microsoft: "https://login.live.com/",
  github: "https://github.com/login",
  proton: "https://account.proton.me/login",
  apple: "https://account.apple.com/sign-in",
};
const warning = /not (be )?secure|unsupported browser|browser (is )?not supported|update your browser|couldn.t sign you in/i;

function open(url, auto) {
  const profile = mkdtempSync(path.join(os.tmpdir(), "cb-s3-"));
  return new Promise((resolve) => {
    const child = spawn(electron, [path.join(here, "app.mjs")], {
      env: { ...process.env, CB_URL: url, CB_PROFILE: profile, CB_AUTO: auto ? "1" : "0" }, stdio: ["ignore", "pipe", "inherit"] });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.on("exit", () => {
      rmSync(profile, { recursive: true, force: true });
      const line = out.split("\n").find((l) => l.startsWith("CB_PAGE "));
      resolve(line ? JSON.parse(line.slice(8)) : null);
    });
  });
}

if (process.argv[2] === "manual") {
  await open(process.argv[3] ?? sites.google, false);
} else {
  const results = {};
  for (const [name, url] of Object.entries(sites)) {
    const p = await open(url, true);
    results[name] = p ? { loaded: true, finalHost: new URL(p.url).host, title: p.title, warning: warning.exec(p.text)?.[0] ?? null }
                      : { loaded: false };
    console.log(name.padEnd(10), JSON.stringify(results[name]));
  }
  writeFileSync(path.join(here, "results-auto.json"), JSON.stringify(results, null, 2) + "\n");
}
