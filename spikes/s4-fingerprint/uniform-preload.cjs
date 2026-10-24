// Prototype of the uniform-fingerprint preload (ADR-0004), main-world patches only.
// Runs in every frame before page scripts via contextBridge.executeInMainWorld.
const { contextBridge } = require("electron");

contextBridge.executeInMainWorld({
  func: (profile) => {
    const define = (proto, key, value) => {
      const d = Object.getOwnPropertyDescriptor(proto, key);
      if (!d) return;
      const getter = { get [key]() { return value; } }; // named like the original
      const fake = Object.getOwnPropertyDescriptor(getter, key).get;
      Object.defineProperty(proto, key, { ...d, get: fake });
    };
    define(Navigator.prototype, "hardwareConcurrency", profile.hardwareConcurrency);
    define(Navigator.prototype, "deviceMemory", profile.deviceMemory);
    define(Screen.prototype, "width", profile.screen[0]);
    define(Screen.prototype, "height", profile.screen[1]);
    define(Screen.prototype, "availWidth", profile.screen[0]);
    define(Screen.prototype, "availHeight", profile.screen[1]);
    define(Screen.prototype, "colorDepth", 24);
    define(Screen.prototype, "pixelDepth", 24);
    Object.defineProperty(window, "devicePixelRatio", { get: () => 1, configurable: true });

    // WebGL: one generic vendor/renderer string.
    for (const C of [WebGLRenderingContext, WebGL2RenderingContext]) {
      const orig = C.prototype.getParameter;
      C.prototype.getParameter = function getParameter(p) {
        if (p === 0x9245) return profile.webglVendor;      // UNMASKED_VENDOR_WEBGL
        if (p === 0x9246) return profile.webglRenderer;    // UNMASKED_RENDERER_WEBGL
        return orig.call(this, p);
      };
    }
    // Canvas read-back: blocked (returns a blank image), the Tor Browser approach.
    const blank = document.createElement("canvas").toDataURL.bind(document.createElement("canvas"));
    HTMLCanvasElement.prototype.toDataURL = function toDataURL() { return blank(); };
  },
  args: [{ hardwareConcurrency: 4, deviceMemory: 8, screen: [1600, 900], webglVendor: "Google Inc.", webglRenderer: "ANGLE (Generic)" }],
});
