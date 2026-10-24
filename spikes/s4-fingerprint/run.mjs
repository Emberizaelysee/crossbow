// Run the S4 probe per variant with two fresh profiles and two window sizes,
// then report, per signal, whether all runs of a variant agree.
//   node run.mjs
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const electron = createRequire(import.meta.url)("electron");
const variants = ["default", "native", "uniform", "uniform-swgl"];
const runs = [{ size: "1280x800" }, { size: "1500x950" }];

function probe(variant, size) {
  const profile = mkdtempSync(path.join(os.tmpdir(), "cb-s4-"));
  return new Promise((resolve, reject) => {
    const child = spawn(electron, [path.join(here, "app.mjs")], {
      env: { ...process.env, CB_VARIANT: variant, CB_SIZE: size, CB_PROFILE: profile }, stdio: ["ignore", "pipe", "pipe"] });
    let out = "", err = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    const timer = setTimeout(() => child.kill(), 30000);
    child.on("exit", () => {
      clearTimeout(timer);
      rmSync(profile, { recursive: true, force: true });
      const line = out.split("\n").find((l) => l.startsWith("CB_FP "));
      line ? resolve(JSON.parse(line.slice(6))) : reject(new Error(`${variant}: no result\n${err}`));
    });
  });
}

const flat = (o, p = "") => Object.entries(o ?? {}).flatMap(([k, v]) =>
  v && typeof v === "object" && !Array.isArray(v) ? flat(v, `${p}${k}.`) : [[`${p}${k}`, JSON.stringify(v)]]);

const report = {};
for (const v of variants) {
  const samples = [];
  for (const r of runs) samples.push(await probe(v, r.size));
  const rows = {};
  for (const [k] of flat(samples[0])) {
    const values = samples.map((s) => Object.fromEntries(flat(s))[k]);
    rows[k] = { same: values.every((x) => x === values[0]), values: [...new Set(values)] };
  }
  report[v] = rows;
  const differing = Object.entries(rows).filter(([, r]) => !r.same).map(([k]) => k);
  console.log(v.padEnd(14), "differs between runs:", differing.join(", ") || "nothing");
}
// results.json is committed: keep the machine's LAN address and time zone out of it.
const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
const redacted = JSON.stringify(report, null, 2)
  .replace(/\b(10|172|192)\.\d+\.\d+\.\d+\b/g, "(real LAN IP, redacted)")
  .replaceAll(tz === "UTC" ? "\u0000" : tz, "(real time zone, redacted)");
writeFileSync(path.join(here, "results.json"), redacted + "\n");
console.log("wrote results.json");
