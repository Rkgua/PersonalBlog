const { app, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");

const isDev = process.env.NODE_ENV === "development" || process.argv.includes("--dev");

let mainWindow = null;
let mongoServer = null;

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

async function startApp() {
  try {
    // 1. Persistent MongoDB via MongoMemoryServer
    const dbPath = path.join(app.getPath("userData"), "mongodb-data");
    fs.mkdirSync(dbPath, { recursive: true });

    mongoServer = await MongoMemoryServer.create({
      instance: { dbPath, storageEngine: "wiredTiger" },
    });
    const mongoUri = mongoServer.getUri();
    console.log(`[electron] MongoDB: ${mongoUri}`);

    process.env.MONGO_URI = mongoUri;
    if (!isDev) process.env.NODE_ENV = "production";

    // 2. Connect Mongoose
    const connectDB = require("../server/config/database");
    await connectDB();

    // 3. Express server
    const exp = express();
    exp.use(cors());
    exp.use(express.json({ limit: "50mb" }));

    // Upload temp directory (outside ASAR)
    const uploadDir = path.join(app.getPath("userData"), "uploads");
    process.env.UPLOAD_DIR = uploadDir;
    fs.mkdirSync(uploadDir, { recursive: true });

    // Serve uploads (images/files that might be referenced from notes)
    exp.use("/uploads", express.static(uploadDir));

    // API routes
    exp.use("/api/posts", require("../server/routes/posts"));
    exp.use("/api/upload", require("../server/uploads/upload"));
    exp.use("/api/qa", require("../server/routes/qa"));

    // Serve built frontend
    if (!isDev) {
      const clientDist = path.join(__dirname, "..", "client", "dist");
      if (fs.existsSync(clientDist)) {
        exp.use(express.static(clientDist));
        exp.get("*", (req, res, next) => {
          if (!req.path.startsWith("/api")) {
            res.sendFile(path.join(clientDist, "index.html"));
          } else {
            next();
          }
        });
      }
    }

    exp.use(require("../server/utils/errorHandler"));

    // 4. Start listening
    const port = isDev ? 5000 : 0;
    const server = exp.listen(port, () => {
      const actualPort = server.address().port;
      console.log(`[electron] Express on port ${actualPort}`);
      createWindow(actualPort);
    });
  } catch (err) {
    console.error("[electron] Failed to start:", err);
    app.quit();
  }
}

app.whenReady().then(startApp);

app.on("window-all-closed", async () => {
  if (mongoServer) await mongoServer.stop();
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (!mainWindow) {
    startApp();
  }
});
