// Launch app.mjs per variant, wait until the blank tab has loaded, let it settle,
// then sum memory over the whole Electron process tree from /proc.
//   node run.mjs [runs=5] [settleMs=8000]
import { spawn } from "node:child_process";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const electron = createRequire(import.meta.url)("electron");
const runs = Number(process.argv[2] ?? 5);
const settleMs = Number(process.argv[3] ?? 8000);

const variants = {
  "bare": {},
  "ui": { CB_UI: "1" },
  "ui+no-spare": { CB_UI: "1", CB_NO_SPARE: "1" },
  "ui+no-spare+low-end": { CB_UI: "1", CB_NO_SPARE: "1", CB_LOW_END: "1" },
  "ui+net-in-process": { CB_UI: "1", CB_NET_IN_PROCESS: "1" },
  "ui+blocker-ads": { CB_UI: "1", CB_BLOCKER: "ads" },
  "ui+blocker-full": { CB_UI: "1", CB_BLOCKER: "full" },
};

function children() {
  const map = new Map();
  for (const d of readdirSync("/proc")) {
    if (!/^\d+$/.test(d)) continue;
    try {
      const stat = readFileSync(`/proc/${d}/stat`, "utf8");
      const ppid = Number(stat.slice(stat.lastIndexOf(")") + 2).split(" ")[1]);
      if (!map.has(ppid)) map.set(ppid, []);
      map.get(ppid).push(Number(d));
    } catch {}
  }
  return map;
}

function tree(root) {
  const map = children();
  const out = [];
  const walk = (p) => { out.push(p); for (const c of map.get(p) ?? []) walk(c); };
  walk(root);
  return out;
}

function memory(pid) {
  try {
    const s = readFileSync(`/proc/${pid}/smaps_rollup`, "utf8");
    const kb = (k) => Number(new RegExp(`^${k}:\\s+(\\d+)`, "m").exec(s)?.[1] ?? 0);
    const type = /--type=([\w-]+)/.exec(readFileSync(`/proc/${pid}/cmdline`, "utf8").replaceAll("\0", " "))?.[1] ?? "browser";
    return { pid, type, pss: kb("Pss"), rss: kb("Rss"), uss: kb("Private_Clean") + kb("Private_Dirty") };
  } catch { return null; }
}

const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };

async function once(env) {
  const t0 = Date.now();
  const child = spawn(electron, [path.join(here, "app.mjs")], { env: { ...process.env, ...env }, stdio: ["ignore", "pipe", "pipe"] });
  let stderr = "";
  child.stderr.on("data", (d) => (stderr += d));
  const readyAt = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout\n" + stderr)), 30000);
    child.stdout.on("data", (d) => {
      const m = /CB_READY (\d+)/.exec(String(d));
      if (m) { clearTimeout(timer); resolve(Number(m[1])); }
    });
    child.on("exit", (c) => reject(new Error(`exited ${c}\n${stderr}`)));
  });
  await new Promise((r) => setTimeout(r, settleMs));
  const procs = tree(child.pid).map(memory).filter(Boolean).filter((p) => p.pss > 0);
  child.kill();
  await new Promise((r) => child.once("exit", r));
  const sum = (k) => procs.reduce((a, p) => a + p[k], 0);
  return { startMs: readyAt - t0, pssMB: sum("pss") / 1024, ussMB: sum("uss") / 1024, rssMB: sum("rss") / 1024,
           processes: procs.map((p) => `${p.type}:${Math.round(p.pss / 1024)}`).join(" ") };
}

const results = {};
for (const [name, env] of Object.entries(variants)) {
  const samples = [];
  for (let i = 0; i < runs; i++) samples.push(await once(env));
  results[name] = {
    startMs: median(samples.map((s) => s.startMs)),
    pssMB: +median(samples.map((s) => s.pssMB)).toFixed(1),
    ussMB: +median(samples.map((s) => s.ussMB)).toFixed(1),
    rssMB: +median(samples.map((s) => s.rssMB)).toFixed(1),
    processes: samples.at(-1).processes,
  };
  console.log(name.padEnd(24), JSON.stringify(results[name]));
}
writeFileSync(path.join(here, "results-memory.json"), JSON.stringify({ electron: process.versions.electron ?? "45.0.0", runs, settleMs, results }, null, 2) + "\n");
