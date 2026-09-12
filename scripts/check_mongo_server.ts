import fs from "fs";
import path from "path";
import mongoose from "mongoose";

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  }
}

loadEnv();

const rawMongoUri = process.env.MONGODB_URI ?? process.env.MONGO_URI ?? "";
const MONGODB_URI = rawMongoUri
  .trim()
  .replace(/^"(.*)"$/, "$1")
  .replace(/^'(.*)'$/, "$1");

async function main() {
  await mongoose.connect(MONGODB_URI);
  const admin = mongoose.connection.db!.admin();
  const info = await admin.serverStatus();
  console.log("MongoDB Version:", info.version);
  console.log("Storage Engine:", info.storageEngine?.name);
  console.log("Replica Set Info:", info.repl ? "Replica Set Active" : "Standalone Server (No Replica Set)");
  await mongoose.disconnect();
}

main().catch(console.error);
