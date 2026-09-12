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
  const db = mongoose.connection.db;
  if (!db) throw new Error("No DB");
  const categories = await db.collection("categories").find({}).toArray();
  console.log("Current categories count:", categories.length);
  for (const c of categories) {
    console.log(`- ${c.name} (slug: ${c.slug}, _id: ${c._id})`);
  }
  await mongoose.disconnect();
}

main().catch(console.error);
