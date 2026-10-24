// S2 probe: edge-reveal with one UI view (ADR-0005).
// At rest the UI view sits *under* the page, full-window; the page is inset by
// ZONE px, so only that thin frame of the UI view gets mouse events. When the
// cursor dwells there, the UI view is raised above the page and shrunk to the
// panel rectangle. CB_MODE=poll instead covers the window with the page and
// polls the cursor position, for the CPU comparison.
import { app, BaseWindow, WebContentsView, ipcMain, screen } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ZONE = Number(process.env.CB_ZONE ?? 2);
const MODE = process.env.CB_MODE ?? "zones";
const PANEL = { left: 300, right: 320, top: 56, bottom: 44 };

app.whenReady().then(async () => {
  // Frameless by default: with a title bar the top hot zone sits under it (CB_FRAME=1 to compare).
  const win = new BaseWindow({ width: 1280, height: 800, backgroundColor: "#111", frame: process.env.CB_FRAME === "1",
    // Frameless windows on Linux turn their outer pixels into resize handles (CB_RESIZABLE=1 to compare).
    resizable: process.env.CB_RESIZABLE === "1" });
  const ui = new WebContentsView({ webPreferences: { preload: path.join(here, "ui-preload.cjs"), sandbox: true, contextIsolation: true } });
  const page = new WebContentsView({ webPreferences: { sandbox: true, contextIsolation: true } });
  ui.setBackgroundColor("#00000000");
  let open = null;

  const layout = () => {
    const { width: w, height: h } = win.getContentBounds();
    const z = MODE === "zones" ? ZONE : 0;
    page.setBounds({ x: z, y: z, width: w - 2 * z, height: h - 2 * z });
    if (!open) {
      win.contentView.addChildView(ui, 0);           // index 0 = bottom of the stack
      ui.setBounds({ x: 0, y: 0, width: w, height: h });
    } else {
      const r = { left: { x: 0, y: 0, width: PANEL.left, height: h }, right: { x: w - PANEL.right, y: 0, width: PANEL.right, height: h },
                  top: { x: 0, y: 0, width: w, height: PANEL.top }, bottom: { x: 0, y: h - PANEL.bottom, width: w, height: PANEL.bottom } }[open];
      win.contentView.addChildView(ui);              // no index = top of the stack
      ui.setBounds(r);
    }
    ui.webContents.send("state", { open, zone: ZONE });
    process.stdout.write(`CB_STATE ${open ?? "none"}\n`);
  };

  win.contentView.addChildView(page);
  ui.webContents.on("console-message", (e) => process.stdout.write(e.message + "\n"));
  page.webContents.on("console-message", (e) => process.stdout.write(e.message + "\n"));
  win.on("resize", layout);
  if (process.env.CB_MAXIMIZE === "1") win.maximize();     // manual check on a real desktop
  ipcMain.on("reveal", (_e, edge) => { open = edge; layout(); });
  ipcMain.on("hide", () => { open = null; layout(); });

  if (MODE === "poll") {
    // Comparison only: what a polling design costs at 60 Hz.
    setInterval(() => {
      const p = screen.getCursorScreenPoint();
      const b = win.getContentBounds();
      const near = p.x - b.x < 3 ? "left" : b.x + b.width - p.x < 3 ? "right" : p.y - b.y < 3 ? "top" : b.y + b.height - p.y < 3 ? "bottom" : null;
      if (near && !open) { open = near; layout(); }
    }, 16);
  }

  await ui.webContents.loadFile(path.join(here, "ui.html"));
  layout();
  await page.webContents.loadURL(process.env.CB_URL ?? "https://en.wikipedia.org/wiki/Crossbow");
  process.stdout.write(`CB_READY ${JSON.stringify(win.getContentBounds())}\n`);
});
