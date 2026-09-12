export type UnitFamily = "weight" | "volume" | "count";
export type BaseUnit = "g" | "ml" | "pcs";
export type DisplayUnit = "kg" | "g" | "liter" | "ml" | "pcs" | "dozen" | "box" | "pack";

export const INGREDIENT_CATEGORIES = [
  "Flour & Grains",
  "Sugar & Sweeteners",
  "Dairy",
  "Eggs",
  "Chocolate & Cocoa",
  "Oils & Fats",
  "Flavorings & Extracts",
  "Fruit & Nuts",
  "Packaging & Disposables",
  "Decorations & Accessories",
  "Other",
] as const;

export type IngredientCategory = (typeof INGREDIENT_CATEGORIES)[number];

export interface IngredientRow {
  _id: string;
  name: string;
  code: string;
  category: IngredientCategory;
  unitFamily: UnitFamily;
  baseUnit: BaseUnit;
  defaultDisplayUnit: DisplayUnit;
  stockInBaseUnit: number;
  minimumStockInBaseUnit: number;
  averageCostPerBaseUnit: number;
  preferredSupplierId?: { _id?: string; name?: string; company?: string } | string;
  branchId?: string;
  notes?: string;
  isActive: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export const BASE_UNITS: Record<UnitFamily, BaseUnit> = {
  weight: "g",
  volume: "ml",
  count: "pcs",
};

export const STANDARD_CONVERSIONS: Record<string, number> = {
  // Weight -> base unit: g
  g: 1,
  gram: 1,
  grams: 1,
  kg: 1000,
  kilogram: 1000,
  kilograms: 1000,

  // Volume -> base unit: ml
  ml: 1,
  milliliter: 1,
  milliliters: 1,
  l: 1000,
  liter: 1000,
  liters: 1000,

  // Count -> base unit: pcs
  pcs: 1,
  piece: 1,
  pieces: 1,
  dozen: 12,
  dz: 12,
};

export const FAMILY_ALLOWED_UNITS: Record<UnitFamily, string[]> = {
  weight: ["g", "kg", "bag", "pack", "box"],
  volume: ["ml", "liter", "l", "bottle", "can", "pack", "box"],
  count: ["pcs", "dozen", "tray", "box", "pack", "bag"],
};

export function isUnitCompatibleWithFamily(unit: string, family: UnitFamily): boolean {
  const norm = unit.toLowerCase().trim();
  const allowed = FAMILY_ALLOWED_UNITS[family] ?? [];
  return allowed.includes(norm);
}

export function toBaseUnits(
  qty: number,
  unit: string,
  family: UnitFamily,
  customConversionFactor?: number
): { quantityInBaseUnit: number; conversionFactor: number } {
  const norm = unit.toLowerCase().trim();

  if (!isUnitCompatibleWithFamily(norm, family)) {
    throw new Error(`Unit '${unit}' is not valid for ${family} ingredients`);
  }

  // Check if standard conversion exists
  const standardFactor = STANDARD_CONVERSIONS[norm];
  if (standardFactor !== undefined) {
    return {
      quantityInBaseUnit: qty * standardFactor,
      conversionFactor: standardFactor,
    };
  }

  // Non-standard bulk packaging unit (bag, box, tray, pack, etc.)
  if (!customConversionFactor || customConversionFactor <= 0) {
    throw new Error(
      `Custom unit '${unit}' requires an explicit conversion factor to ${BASE_UNITS[family]} (e.g. 1 ${unit} = X ${BASE_UNITS[family]})`
    );
  }

  return {
    quantityInBaseUnit: qty * customConversionFactor,
    conversionFactor: customConversionFactor,
  };
}

export function formatIngredientStock(stockInBaseUnit: number, displayUnit: string): string {
  const norm = displayUnit.toLowerCase().trim();
  const factor = STANDARD_CONVERSIONS[norm] || 1;
  const displayQty = stockInBaseUnit / factor;
  const formatted = displayQty % 1 === 0 ? displayQty.toString() : displayQty.toFixed(2);
  return `${formatted} ${displayUnit}`;
}

export function generateIngredientCode(prefix = "ING", name?: string): string {
  let namePart = "";
  if (name) {
    const words = name
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w.slice(0, 5).toUpperCase())
      .filter(Boolean);
    namePart = words.join("-");
  }
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return namePart ? `${prefix}-${namePart}-${rand}` : `${prefix}-${rand}`;
}
