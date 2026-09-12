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
  if (!MONGODB_URI) {
    console.error("No MONGODB_URI found");
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB for backup:", mongoose.connection.name);
  const db = mongoose.connection.db!;

  const collections = await db.listCollections().toArray();
  const backupData: Record<string, unknown[]> = {};

  const backupDir = path.join(process.cwd(), "backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  for (const coll of collections) {
    const name = coll.name;
    const docs = await db.collection(name).find({}).toArray();
    backupData[name] = docs;
    console.log(`Backed up collection '${name}': ${docs.length} documents`);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFile = path.join(backupDir, `backup-phase2-pre-${timestamp}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), "utf-8");

  console.log(`\n✅ Backup successfully created at: ${backupFile}`);
  await mongoose.disconnect();
}

main().catch(console.error);
