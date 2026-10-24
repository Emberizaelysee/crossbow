const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("cb", {
  reveal: (edge) => ipcRenderer.send("reveal", edge),
  hide: () => ipcRenderer.send("hide"),
  onState: (fn) => ipcRenderer.on("state", (_e, s) => fn(s)),
});
