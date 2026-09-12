import { connectDB } from "../src/lib/db";
import { Purchase } from "../src/models/Purchase";
import { Supplier } from "../src/models/Supplier";
import { InventoryLog } from "../src/models/InventoryLog";
import { Ingredient } from "../src/models/Ingredient";
import { IngredientStockLog } from "../src/models/IngredientStockLog";

async function clean() {
  await connectDB();
  await Purchase.deleteMany({ notes: /Phase 2 Automated Verification/ });
  await InventoryLog.deleteMany({
    $or: [
      { reference: { $in: ["INV-260910-0628", "INV-260910-7510", "INV-260910-2022", "INV-260910-5682"] } },
      { reference: { $regex: /^PUR-/ } },
      { type: "purchase" }
    ]
  });
  await Ingredient.deleteMany({ name: /Test Belgian Cocoa/ });
  await IngredientStockLog.deleteMany({ reason: /Test/i });
  await Supplier.updateMany({}, { dueBalance: 0, totalPaid: 0 });
  console.log("Cleanup complete");
}

clean().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
