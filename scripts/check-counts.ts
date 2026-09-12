import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/pos_system";

async function main() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  if (!db) {
    console.error("Database connection failed");
    process.exit(1);
  }

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
  ];

  console.log("Current MongoDB Document Counts:");
  const counts: Record<string, number> = {};
  for (const name of collections) {
    const count = await db.collection(name).countDocuments();
    counts[name] = count;
    console.log(`  - ${name}: ${count}`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Error checking counts:", err);
  process.exit(1);
});
