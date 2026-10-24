// S3 probe: open a sign-in page with Crossbow's planned identity (reduced Chrome
// user agent and client hints, same as the S4 "native" variant).
//   CB_URL=https://accounts.google.com  [CB_AUTO=1 prints a page summary and quits]
import { app, BaseWindow, WebContentsView, session } from "electron";

const major = () => process.versions.chrome.split(".")[0];
const UA = () => `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${major()}.0.0.0 Safari/537.36`;
if (process.env.CB_PROFILE) app.setPath("userData", process.env.CB_PROFILE);

app.whenReady().then(async () => {
  const ses = session.fromPartition("s3");
  ses.setUserAgent(UA(), "en-US,en");
  ses.webRequest.onBeforeSendHeaders((d, cb) => {
    d.requestHeaders["sec-ch-ua"] = `"Chromium";v="${major()}", "Not?A_Brand";v="24"`;
    d.requestHeaders["sec-ch-ua-platform"] = '"Linux"';
    cb({ requestHeaders: d.requestHeaders });
  });
  const win = new BaseWindow({ width: 1100, height: 800, title: "Crossbow S3 sign-in test" });
  const view = new WebContentsView({ webPreferences: { session: ses, sandbox: true, contextIsolation: true } });
  win.contentView.addChildView(view);
  const fit = () => { const b = win.getContentBounds(); view.setBounds({ x: 0, y: 0, width: b.width, height: b.height }); };
  win.on("resize", fit); fit();
  win.on("closed", () => app.quit());

  await view.webContents.loadURL(process.env.CB_URL).catch(() => {});
  if (process.env.CB_AUTO === "1") {
    await new Promise((r) => setTimeout(r, 4000));
    const summary = await view.webContents.executeJavaScript(`({ url: location.href, title: document.title,
      text: document.body ? document.body.innerText.slice(0, 1500) : "" })`);
    process.stdout.write("CB_PAGE " + JSON.stringify(summary) + "\n");
    app.quit();
  }
});
