import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CURRENCY_CODE = "PKR";
export const CURRENCY_SYMBOL = "Rs.";

export function formatCurrency(
  amount: number | string | null | undefined,
  options?: { showDecimals?: boolean }
): string {
  const num = typeof amount === "number" ? amount : Number(amount) || 0;
  const hasDecimals = options?.showDecimals ?? (num % 1 !== 0);
  const formatted = num.toLocaleString("en-US", {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  });
  return `Rs. ${formatted}`;
}

export function generateSKU(prefix = "BAK", name?: string) {
  let namePart = "";
  if (name) {
    const words = name
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .trim()
      .split(/\s+/)
      .slice(0, 3)
      .map((w) => w.slice(0, 5).toUpperCase())
      .filter(Boolean);
    namePart = words.join("-");
  }
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  const ts = Date.now().toString(36).slice(-3).toUpperCase();
  const base = namePart
    ? `${prefix}-${namePart}-${rand}${ts}`
    : `${prefix}-${Date.now().toString(36).toUpperCase()}-${rand}`;
  return base.slice(0, 32);
}

export function generateBarcode() {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(0, 13);
}

export function generateInvoiceNumber(prefix = "INV") {
  const date = new Date();
  const ymd =
    date.getFullYear().toString().slice(-2) +
    String(date.getMonth() + 1).padStart(2, "0") +
    String(date.getDate()).padStart(2, "0");
  const seq = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `${prefix}-${ymd}-${seq}`;
}
