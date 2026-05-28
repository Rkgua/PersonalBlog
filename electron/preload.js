const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true,
  platform: process.platform,
  onUpdateAvailable: (cb) => {
    ipcRenderer.on("update-available", (_, info) => cb(info));
  },
  onDownloadProgress: (cb) => {
    ipcRenderer.on("download-progress", (_, p) => cb(p));
  },
  onUpdateDownloaded: (cb) => {
    ipcRenderer.on("update-downloaded", (_, info) => cb(info));
  },
});
