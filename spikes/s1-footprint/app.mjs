// S1 footprint probe: one window, optional UI overlay, one blank tab.
// Variant flags come from CB_* env vars so run.mjs can compare them.
import { app, BaseWindow, WebContentsView, session } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const env = (k) => process.env[k] === "1";

if (env("CB_NO_SPARE")) {
  // Chromium keeps a warm spare renderer process around; it costs memory at idle.
  app.commandLine.appendSwitch("disable-features", "SpareRendererForSitePerProcess");
}
if (env("CB_NET_IN_PROCESS")) {
  // Run the network service inside the browser process: one process fewer, less isolation.
  app.commandLine.appendSwitch("enable-features", "NetworkServiceInProcess2");
}
if (env("CB_LOW_END")) {
  // Chromium's own low-memory mode: smaller caches and tile budgets.
  app.commandLine.appendSwitch("enable-low-end-device-mode");
}

app.whenReady().then(async () => {
  const win = new BaseWindow({ width: 1280, height: 800, show: true });
  const tab = new WebContentsView({ webPreferences: { sandbox: true, contextIsolation: true } });
  win.contentView.addChildView(tab);
  tab.setBounds({ x: 0, y: 0, width: 1280, height: 800 });

  if (env("CB_UI")) {
    const ui = new WebContentsView({ webPreferences: { sandbox: true, contextIsolation: true, transparent: true } });
    ui.setBackgroundColor("#00000000");
    win.contentView.addChildView(ui);
    ui.setBounds({ x: 0, y: 0, width: 4, height: 800 });
    await ui.webContents.loadFile(path.join(here, "ui.html"));
  }

  if (process.env.CB_BLOCKER) {
    // CB_BLOCKER=full: ads + tracking lists; CB_BLOCKER=ads: ads lists only.
    const { ElectronBlocker } = await import("@ghostery/adblocker-electron");
    const fs = await import("node:fs/promises");
    const kind = process.env.CB_BLOCKER;
    const cache = path.join(here, "data", `engine-${kind}.bin`);
    const load = kind === "ads" ? ElectronBlocker.fromPrebuiltAdsOnly : ElectronBlocker.fromPrebuiltAdsAndTracking;
    const blocker = await load.call(ElectronBlocker, fetch, {
      path: cache, read: fs.readFile, write: async (p, b) => { await fs.mkdir(path.dirname(p), { recursive: true }); await fs.writeFile(p, b); },
    });
    blocker.enableBlockingInSession(session.defaultSession);
  }

  tab.webContents.once("did-finish-load", () => {
    process.stdout.write(`CB_READY ${Date.now()}\n`);
  });
  await tab.webContents.loadURL("about:blank");
});
