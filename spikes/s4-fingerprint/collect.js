// Collects the fingerprint signals listed in docs/privacy.md, from the page and
// from a dedicated worker (preload patches don't reach workers).
async function sha(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].slice(0, 8).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function canvasHash() {
  const c = document.getElementById("c");
  const g = c.getContext("2d");
  g.textBaseline = "top";
  g.font = "16px Arial";
  g.fillStyle = "#f60"; g.fillRect(100, 1, 62, 20);
  g.fillStyle = "#069"; g.fillText("Crossbow 🏹 fingerprint", 2, 15);
  g.fillStyle = "rgba(102,204,0,0.7)"; g.fillText("Crossbow 🏹 fingerprint", 4, 17);
  return sha(c.toDataURL());
}

async function webgl() {
  const gl = document.createElement("canvas").getContext("webgl");
  if (!gl) return { available: false };
  const dbg = gl.getExtension("WEBGL_debug_renderer_info");
  const params = [gl.MAX_TEXTURE_SIZE, gl.MAX_VIEWPORT_DIMS, gl.MAX_RENDERBUFFER_SIZE, gl.ALIASED_LINE_WIDTH_RANGE,
    gl.MAX_VERTEX_UNIFORM_VECTORS, gl.MAX_FRAGMENT_UNIFORM_VECTORS].map((p) => String(gl.getParameter(p)));
  return {
    vendor: dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
    renderer: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
    paramsHash: await sha(params.join("|") + (gl.getSupportedExtensions() ?? []).join(",")),
  };
}

async function audioHash() {
  const ctx = new OfflineAudioContext(1, 5000, 44100);
  const osc = ctx.createOscillator(); osc.type = "triangle"; osc.frequency.value = 10000;
  const comp = ctx.createDynamicsCompressor();
  osc.connect(comp); comp.connect(ctx.destination); osc.start(0);
  const buf = await ctx.startRendering();
  return sha(Array.from(buf.getChannelData(0).slice(4500)).join(","));
}

function fonts() {
  const probe = ["Arial", "Helvetica", "Times New Roman", "Courier New", "DejaVu Sans", "Liberation Sans", "Ubuntu",
    "Noto Sans", "Cantarell", "Segoe UI", "Calibri", "Roboto", "Fira Sans", "Comic Sans MS", "Noto Color Emoji"];
  const c = document.createElement("canvas").getContext("2d");
  const w = (f) => { c.font = `20px ${f}`; return c.measureText("mmmmmmmmmmlli 🏹").width; };
  const base = w("monospace");
  return probe.filter((f) => w(`'${f}', monospace`) !== base);
}

async function localIps() {
  try {
    const pc = new RTCPeerConnection({ iceServers: [] });
    pc.createDataChannel("x");
    await pc.setLocalDescription(await pc.createOffer());
    await new Promise((r) => setTimeout(r, 800));
    const sdp = pc.localDescription?.sdp ?? "";
    pc.close();
    return [...new Set([...sdp.matchAll(/candidate:\S+ \d \w+ \d+ (\S+)/g)].map((m) => m[1]))];
  } catch (e) { return [`error: ${e.message}`]; }
}

function workerSignals() {
  const src = `postMessage({ ua: navigator.userAgent, hc: navigator.hardwareConcurrency, dm: navigator.deviceMemory,
    langs: navigator.languages, tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    gl: (() => { try { const g = new OffscreenCanvas(1,1).getContext("webgl"); const d = g.getExtension("WEBGL_debug_renderer_info");
      return d ? g.getParameter(d.UNMASKED_RENDERER_WEBGL) : null; } catch (e) { return "n/a"; } })() });`;
  const w = new Worker(URL.createObjectURL(new Blob([src], { type: "text/javascript" })));
  return new Promise((r) => { w.onmessage = (e) => { r(e.data); w.terminate(); }; });
}

function nativeLooking() {
  // Patched getters often stop looking native; detectors check exactly this.
  const get = (o, k) => Object.getOwnPropertyDescriptor(o, k)?.get;
  const checks = {
    "Navigator.hardwareConcurrency": get(Navigator.prototype, "hardwareConcurrency"),
    "Navigator.languages": get(Navigator.prototype, "languages"),
    "Screen.width": get(Screen.prototype, "width"),
    "HTMLCanvasElement.toDataURL": HTMLCanvasElement.prototype.toDataURL,
    "WebGLRenderingContext.getParameter": WebGLRenderingContext.prototype.getParameter,
  };
  return Object.fromEntries(Object.entries(checks).map(([k, f]) => [k, f ? /\{\s*\[native code\]\s*\}$/.test(Function.prototype.toString.call(f)) : "missing"]));
}

async function collect() {
  let uach = null;
  if (navigator.userAgentData) {
    uach = await navigator.userAgentData.getHighEntropyValues(["platform", "platformVersion", "architecture", "bitness", "model", "uaFullVersion", "fullVersionList"]);
  }
  const s = {
    userAgent: navigator.userAgent,
    uaClientHints: uach,
    languages: navigator.languages,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen: `${screen.width}x${screen.height}`,
    availScreen: `${screen.availWidth}x${screen.availHeight}`,
    window: `${innerWidth}x${innerHeight}`,
    devicePixelRatio: devicePixelRatio,
    colorDepth: screen.colorDepth,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: navigator.deviceMemory,
    platform: navigator.platform,
    canvas: await canvasHash(),
    webgl: await webgl(),
    audio: await audioHash(),
    fonts: fonts(),
    mediaDevices: (await navigator.mediaDevices?.enumerateDevices?.() ?? []).map((d) => d.kind),
    localIps: await localIps(),
    worker: await workerSignals(),
    nativeLooking: nativeLooking(),
  };
  return s;
}

collect().then((s) => { window.__fp = s; document.title = "done"; });
