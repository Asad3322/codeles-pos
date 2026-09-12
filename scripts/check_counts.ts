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
  const db = mongoose.connection.db!;

  const collections = [
    "products",
    "categories",
    "brands",
    "sales",
    "purchases",
    "customers",
    "suppliers",
    "users",
    "settings",
    "inventorylogs",
    "notifications",
    "branches",
    "roles",
    "expenses"
  ];

  console.log("--- BASELINE MONGO COUNTS ---");
  for (const collName of collections) {
    try {
      const count = await db.collection(collName).countDocuments();
      console.log(`${collName}: ${count}`);
    } catch (err) {
      console.log(`${collName}: 0 (collection not created yet or error: ${err})`);
    }
  }

  await mongoose.disconnect();
}

main().catch(console.error);
