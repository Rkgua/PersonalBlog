const { app, BrowserWindow, dialog, Menu } = require("electron");
const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");

const isDev = process.env.NODE_ENV === "development" || process.argv.includes("--dev");

process.on("uncaughtException", (err) => {
  dialog.showErrorBox("启动失败", err.stack || err.message);
  app.quit();
});

process.on("unhandledRejection", (err) => {
  dialog.showErrorBox("启动失败", err.stack || err.message);
  app.quit();
});

let mainWindow = null;

function setupMenu() {
  const template = [
    {
      label: "PersonalNoteTable",
      submenu: [
        { role: "about", label: "关于" },
        { type: "separator" },
        { role: "quit", label: "退出" },
      ],
    },
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 850,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    const loadDevServer = () => {
      mainWindow.loadURL("http://localhost:5173").catch(() => {
        setTimeout(loadDevServer, 1000);
      });
    };
    loadDevServer();
  } else {
    mainWindow.loadURL(`http://localhost:${port}`);
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function setupAutoUpdater() {
  if (isDev) return;
  const { autoUpdater } = require("electron-updater");
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.setFeedURL({
    provider: "github",
    owner: "Rkgua",
    repo: "PersonalNoteTable",
  });
  autoUpdater.logger = {
    info: () => {},
    warn: () => {},
    error: () => {},
  };
  // Delay update check to prioritize app startup
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(() => {});
  }, 10000);
  autoUpdater.on("update-available", (info) => {
    if (mainWindow) mainWindow.webContents.send("update-available", info);
  });
  autoUpdater.on("download-progress", (p) => {
    if (mainWindow) mainWindow.webContents.send("download-progress", p);
  });
  autoUpdater.on("update-downloaded", (info) => {
    if (mainWindow) mainWindow.webContents.send("update-downloaded", info);
    dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "更新已下载",
      message: `版本 ${info.version} 已准备好，是否立即重启安装？`,
      buttons: ["稍后重启", "立即重启"],
      defaultId: 1,
    }).then((r) => { if (r.response === 1) autoUpdater.quitAndInstall(); });
  });
  autoUpdater.on("error", () => {});
}

async function startApp() {
  try {
    if (!isDev) process.env.NODE_ENV = "production";

    const userDataDir = app.getPath("userData");
    process.env.USER_DATA_DIR = userDataDir;
    fs.mkdirSync(path.join(userDataDir, "data"), { recursive: true });

    require("../server/models/database");

    const exp = express();
    exp.use(cors());
    exp.use(express.json({ limit: "50mb" }));

    const uploadDir = path.join(userDataDir, "uploads");
    process.env.UPLOAD_DIR = uploadDir;
    fs.mkdirSync(uploadDir, { recursive: true });

    exp.use("/uploads", express.static(uploadDir));

    exp.use("/api/posts", require("../server/routes/posts"));
    exp.use("/api/upload", require("../server/uploads/upload"));
    exp.use("/api/qa", require("../server/routes/qa"));

    if (!isDev) {
      const clientDist = path.join(__dirname, "..", "client", "dist");
      if (fs.existsSync(clientDist)) {
        exp.use(express.static(clientDist));
        exp.use((req, res, next) => {
          if (!req.path.startsWith("/api")) {
            res.sendFile(path.join(clientDist, "index.html"));
          } else {
            next();
          }
        });
      }
    }

    exp.use(require("../server/utils/errorHandler"));

    const port = isDev ? 5000 : 0;
    const server = exp.listen(port, () => {
      const actualPort = server.address().port;
      createWindow(actualPort);
      setupMenu();
      setupAutoUpdater();
    });
  } catch (err) {
    dialog.showErrorBox("启动失败", err.stack || err.message);
    app.quit();
  }
}

app.whenReady().then(startApp);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (!mainWindow) startApp();
});
