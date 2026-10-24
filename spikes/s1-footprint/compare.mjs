// Same measurement as run.mjs, for installed browsers with a fresh profile and
// one blank tab, to put the Electron numbers in context.
//   node compare.mjs
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function allProcs() {
  const list = [];
  for (const d of readdirSync("/proc")) {
    if (!/^\d+$/.test(d)) continue;
    try {
      const stat = readFileSync(`/proc/${d}/stat`, "utf8");
      const cmd = readFileSync(`/proc/${d}/cmdline`, "utf8").replaceAll("\0", " ");
      list.push({ pid: +d, ppid: +stat.slice(stat.lastIndexOf(")") + 2).split(" ")[1], cmd });
    } catch {}
  }
  return list;
}
const pss = (pid) => { try { return +/^Pss:\s+(\d+)/m.exec(readFileSync(`/proc/${pid}/smaps_rollup`, "utf8"))[1]; } catch { return 0; } };

// Processes are matched by the unique profile path in their command line, plus their descendants.
function measure(marker) {
  const procs = allProcs();
  const roots = new Set(procs.filter((p) => p.cmd.includes(marker)).map((p) => p.pid));
  let grew = true;
  while (grew) { grew = false; for (const p of procs) if (!roots.has(p.pid) && roots.has(p.ppid)) { roots.add(p.pid); grew = true; } }
  return { processes: roots.size, pssMB: +([...roots].reduce((a, p) => a + pss(p), 0) / 1024).toFixed(1) };
}

const browsers = {
  brave: (dir) => ["brave-browser", [`--user-data-dir=${dir}`, "--no-first-run", "--no-default-browser-check", "--new-window", "about:blank"]],
  firefox: (dir) => ["firefox", ["-no-remote", "-profile", dir, "-new-instance", "about:blank"]],
};

const results = {};
for (const [name, cmd] of Object.entries(browsers)) {
  const base = name === "firefox" ? path.join(os.homedir(), "snap/firefox/common") : os.tmpdir();
  const runs = [];
  for (let i = 0; i < 3; i++) {
    const dir = path.join(base, `cb-s1-${name}-${process.pid}-${i}`);
    mkdirSync(dir, { recursive: true });
    const [bin, args] = cmd(dir);
    const child = spawn(bin, args, { stdio: "ignore", detached: true });
    await sleep(12000);
    runs.push(measure(dir));
    try { process.kill(-child.pid, "SIGTERM"); } catch {}
    for (const p of allProcs().filter((p) => p.cmd.includes(dir))) { try { process.kill(p.pid, "SIGTERM"); } catch {} }
    await sleep(2000);
    rmSync(dir, { recursive: true, force: true });
  }
  runs.sort((a, b) => a.pssMB - b.pssMB);
  results[name] = runs[1];
  console.log(name.padEnd(8), JSON.stringify(results[name]));
}
writeFileSync(path.join(here, "results-compare.json"), JSON.stringify(results, null, 2) + "\n");
