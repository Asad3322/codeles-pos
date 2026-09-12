import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/pos_system";

const BAKERY_CATEGORIES = [
  { name: "Cakes", slug: "cakes", description: "Freshly baked cakes, celebration cakes & custom bakes" },
  { name: "Pastries", slug: "pastries", description: "Flaky croissants, fruit tarts, danishes & puff pastries" },
  { name: "Bread & Buns", slug: "bread-buns", description: "Artisan breads, loaves, burger buns & dinner rolls" },
  { name: "Cookies", slug: "cookies", description: "Choc-chip, butter cookies, shortbreads & biscuits" },
  { name: "Brownies", slug: "brownies", description: "Fudge brownies, walnut brownies & blondies" },
  { name: "Cupcakes", slug: "cupcakes", description: "Frosted cupcakes and mini bakes" },
  { name: "Donuts", slug: "donuts", description: "Glazed, filled and ring donuts" },
  { name: "Desserts", slug: "desserts", description: "Puddings, custards, mousses & specialty sweets" },
  { name: "Beverages", slug: "beverages", description: "Coffee, tea, fresh juices, shakes & bottled drinks" },
  { name: "Birthday Accessories", slug: "birthday-accessories", description: "Candles, toppers, balloons, party hats & sparklers" },
];

async function main() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  if (!db) {
    console.error("Database connection failed");
    process.exit(1);
  }

  const collection = db.collection("categories");
  console.log("Safe Idempotent Bakery Categories Setup:");

  let addedCount = 0;
  let skippedCount = 0;

  for (const cat of BAKERY_CATEGORIES) {
    const existing = await collection.findOne({
      $or: [{ slug: cat.slug }, { name: { $regex: new RegExp(`^${cat.name}$`, "i") } }],
    });

    if (existing) {
      console.log(`  [EXISTS] "${cat.name}" (slug: ${existing.slug}) -> Skipped`);
      skippedCount++;
    } else {
      const now = new Date();
      await collection.insertOne({
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      console.log(`  [CREATED] "${cat.name}" (slug: ${cat.slug})`);
      addedCount++;
    }
  }

  const total = await collection.countDocuments();
  console.log(`\nResult: Added ${addedCount}, Skipped ${skippedCount}. Total Categories in DB: ${total}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
