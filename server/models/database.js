const Datastore = require("@seald-io/nedb");
const path = require("path");
const fs = require("fs");

let dataDir;
if (process.env.USER_DATA_DIR) {
  dataDir = path.join(process.env.USER_DATA_DIR, "data");
} else {
  dataDir = path.join(__dirname, "..", "data");
}
fs.mkdirSync(dataDir, { recursive: true });

const db = new Datastore({
  filename: path.join(dataDir, "notes.db"),
  autoload: true,
});

module.exports = db;
