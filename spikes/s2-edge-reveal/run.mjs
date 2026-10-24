// Drive the S2 probe inside a nested Xephyr X server with XTest, so the real
// desktop cursor is never touched.
//   XTEST_MOVE=/path/to/xtest-move node run.mjs
import { spawn, execFileSync } from "node:child_process";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const electron = createRequire(import.meta.url)("electron");
const MOVE = process.env.XTEST_MOVE;
const DISPLAY = ":7";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const xephyr = spawn("Xephyr", [DISPLAY, "-screen", "1280x800", "-ac", "-br", "-noreset"], { stdio: "ignore" });
await sleep(1500);

function start(mode) {
  const child = spawn(electron, [path.join(here, "app.mjs")], {
    env: { ...process.env, DISPLAY, CB_MODE: mode, CB_URL: pathToFileURL(path.join(here, "test-page.html")).href },
    stdio: ["ignore", "pipe", "pipe"] });
  const lines = [];
  child.stdout.on("data", (d) => lines.push(...String(d).split("\n").filter(Boolean)));
  child.stderr.on("data", () => {});
  return { child, lines };
}

async function waitFor(lines, re, ms = 20000) {
  const t = Date.now();
  while (Date.now() - t < ms) { const l = lines.find((x) => re.test(x)); if (l) return l; await sleep(20); }
  throw new Error(`timeout waiting for ${re}`);
}

const move = (x, y, click) => execFileSync(MOVE, [String(x), String(y), ...(click ? ["click"] : [])], { env: { ...process.env, DISPLAY } });
const count = (lines, re) => lines.filter((l) => re.test(l)).length;

function cpuTicks(root) {
  const kids = new Map();
  for (const d of readdirSync("/proc")) {
    if (!/^\d+$/.test(d)) continue;
    try { const s = readFileSync(`/proc/${d}/stat`, "utf8"); const f = s.slice(s.lastIndexOf(")") + 2).split(" ");
          (kids.get(+f[1]) ?? kids.set(+f[1], []).get(+f[1])).push({ pid: +d, t: +f[11] + +f[12] }); } catch {}
  }
  let sum = 0; const walk = (p) => { for (const k of kids.get(p) ?? []) { sum += k.t; walk(k.pid); } };
  try { const s = readFileSync(`/proc/${root}/stat`, "utf8"); const f = s.slice(s.lastIndexOf(")") + 2).split(" "); sum += +f[11] + +f[12]; } catch {}
  walk(root); return sum;
}

const results = { checks: {}, latencyMs: {}, idleCpuPercent: {} };
const check = (name, ok) => { results.checks[name] = ok; console.log(ok ? "PASS" : "FAIL", name); };

// Behaviour and latency with hot zones.
{
  const { child, lines } = start("zones");
  const b = JSON.parse((await waitFor(lines, /^CB_READY /)).slice(9));
  const cx = b.x + b.width / 2, cy = b.y + b.height / 2;
  await sleep(800);

  move(cx, cy, true); await sleep(300);
  check("page receives clicks at rest", count(lines, /^CB_PAGE_CLICK/) === 1);

  move(b.x, cy); await sleep(60); move(cx, cy); await sleep(400);
  check("brief pass over the edge does not reveal", count(lines, /^CB_STATE left/) === 0);

  const edges = { left: [b.x, cy], right: [b.x + b.width - 1, cy], top: [cx, b.y], bottom: [cx, b.y + b.height - 1] };
  const inside = { left: [b.x + 100, cy], right: [b.x + b.width - 100, cy], top: [cx, b.y + 20], bottom: [cx, b.y + b.height - 20] };
  for (const [edge, [x, y]] of Object.entries(edges)) {
    const lat = [];
    for (let i = 0; i < 5; i++) {
      const before = count(lines, new RegExp(`^CB_STATE ${edge}$`));
      const revealsBefore = count(lines, /^CB_REVEAL_MS/);
      move(x, y); await sleep(450);
      const opened = count(lines, new RegExp(`^CB_STATE ${edge}$`)) === before + 1;
      if (i === 0) check(`${edge} edge reveals after dwell`, opened);
      move(...inside[edge]); await sleep(500);
      if (i === 0) check(`${edge} panel stays open while hovered`, lines.filter((l) => l.startsWith("CB_STATE")).at(-1) === `CB_STATE ${edge}`);
      if (i === 0 && edge === "left") {
        const clicks = count(lines, /^CB_PAGE_CLICK/);
        move(cx + 200, cy, true); await sleep(200);
        check("page outside an open panel receives clicks", count(lines, /^CB_PAGE_CLICK/) === clicks + 1);
      }
      move(cx, cy); await sleep(700);
      if (i === 0) check(`${edge} panel hides after leaving`, lines.filter((l) => l.startsWith("CB_STATE")).at(-1) === "CB_STATE none");
      const r = lines.filter((l) => l.startsWith("CB_REVEAL_MS")).slice(revealsBefore);
      if (r.length) lat.push(Number(r[0].split(" ")[1]));
    }
    lat.sort((a, b) => a - b);
    results.latencyMs[edge] = { median: lat[lat.length >> 1], max: lat.at(-1), n: lat.length };
  }

  move(cx, cy); await sleep(1000);
  const t0 = cpuTicks(child.pid); await sleep(10000); const t1 = cpuTicks(child.pid);
  results.idleCpuPercent.zones = +((t1 - t0) / 100 / 10 * 100).toFixed(2);
  child.kill(); await sleep(500);
}

// Idle CPU of the polling alternative.
{
  const { child, lines } = start("poll");
  const b = JSON.parse((await waitFor(lines, /^CB_READY /)).slice(9));
  move(b.x + b.width / 2, b.y + b.height / 2); await sleep(2000);
  const t0 = cpuTicks(child.pid); await sleep(10000); const t1 = cpuTicks(child.pid);
  results.idleCpuPercent.poll = +((t1 - t0) / 100 / 10 * 100).toFixed(2);
  child.kill(); await sleep(500);
}

xephyr.kill();
console.log(JSON.stringify(results, null, 2));
writeFileSync(path.join(here, "results-x11.json"), JSON.stringify(results, null, 2) + "\n");
