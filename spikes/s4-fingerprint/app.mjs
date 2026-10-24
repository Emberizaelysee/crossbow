// S4 probe: load collect.html under a given variant and print the collected signals.
//   CB_VARIANT=default|native|uniform|uniform-swgl  CB_PROFILE=<dir>  CB_SIZE=WxH
import { app, BaseWindow, WebContentsView, session } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const variant = process.env.CB_VARIANT ?? "default";
const [w, h] = (process.env.CB_SIZE ?? "1280x800").split("x").map(Number);
if (process.env.CB_PROFILE) app.setPath("userData", process.env.CB_PROFILE);

const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{major}.0.0.0 Safari/537.36";

if (variant !== "default") {
  process.env.TZ = "UTC";                                   // native: Intl and Date
  app.commandLine.appendSwitch("lang", "en-US");            // native: navigator.language(s)
  app.commandLine.appendSwitch("force-webrtc-ip-handling-policy", "disable_non_proxied_udp");
}
if (variant === "uniform-swgl") {
  // Software WebGL: same renderer for everyone, at a performance cost.
  app.commandLine.appendSwitch("use-angle", "swiftshader");
  app.commandLine.appendSwitch("enable-unsafe-swiftshader");
}

app.whenReady().then(async () => {
  const major = process.versions.chrome.split(".")[0];
  const ses = session.fromPartition("s4");
  if (variant !== "default") {
    ses.setUserAgent(UA.replace("{major}", major), "en-US,en");
    ses.webRequest.onBeforeSendHeaders((d, cb) => {
      const hdr = d.requestHeaders;
      hdr["sec-ch-ua"] = `"Chromium";v="${major}", "Not?A_Brand";v="24"`;
      hdr["sec-ch-ua-platform"] = '"Linux"';
      cb({ requestHeaders: hdr });
    });
    ses.setPermissionCheckHandler(() => false);
    ses.setPermissionRequestHandler((_wc, _p, cb) => cb(false));
  }
  const preload = variant.startsWith("uniform") ? path.join(here, "uniform-preload.cjs") : undefined;
  const win = new BaseWindow({ width: w, height: h, show: true });
  const view = new WebContentsView({ webPreferences: { session: ses, sandbox: true, contextIsolation: true, preload } });
  win.contentView.addChildView(view);
  view.setBounds({ x: 0, y: 0, width: w, height: h });
  view.webContents.on("page-title-updated", async (_e, title) => {
    if (title !== "done") return;
    const fp = await view.webContents.executeJavaScript("window.__fp");
    process.stdout.write("CB_FP " + JSON.stringify(fp) + "\n");
    app.quit();
  });
  await view.webContents.loadFile(path.join(here, "collect.html"));
});
