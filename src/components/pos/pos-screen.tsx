"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Search,
  Barcode,
  Trash2,
  Pause,
  Play,
  CreditCard,
  Banknote,
  Printer,
  Plus,
  Minus,
  ShoppingBag,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "@/hooks/use-debounce";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useCartStore } from "@/stores/cart-store";
import { formatCurrency, cn } from "@/lib/utils";
import { printThermalReceipt } from "@/lib/print-invoice";
import type { CartItem } from "@/types";

interface ProductResult {
  _id: string;
  name: string;
  sku: string;
  barcode?: string;
  sellingPrice: number;
  stock: number;
  images?: string[];
  taxRate?: number;
}

interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
}

export function PosScreen() {
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [products, setProducts] = useState<ProductResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  const debouncedSearch = useDebounce(search);

  const {
    items,
    discount,
    taxRate,
    heldCarts,
    addItem,
    removeItem,
    updateQuantity,
    setDiscount,
    clearCart,
    holdCart,
    resumeCart,
    getSubtotal,
    getTotal,
  } = useCartStore();

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((json) => {
        if (json?.success && Array.isArray(json.data)) {
          setCategories(json.data);
        }
      })
      .catch(() => {});
  }, []);

  const fetchProducts = useCallback(async (q: string, categoryId: string) => {
    setLoading(true);
    try {
      const catParam = categoryId !== "all" ? `&categoryId=${encodeURIComponent(categoryId)}` : "";
      const url = q
        ? `/api/products/search?q=${encodeURIComponent(q)}${catParam}`
        : `/api/products?limit=50${catParam}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setProducts(q ? json.data : (json.data.items ?? []));
      }
    } catch {
      // silently handle network error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(debouncedSearch, selectedCategory);
  }, [debouncedSearch, selectedCategory, fetchProducts]);

  const addProductToCart = (product: ProductResult) => {
    if (product.stock <= 0) {
      toast.error(`${product.name} is out of stock`);
      return;
    }
    const item: CartItem = {
      productId: product._id,
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      price: product.sellingPrice,
      quantity: 1,
      discount: 0,
      tax: product.taxRate ?? 0,
      image: product.images?.[0],
    };
    addItem(item);
    toast.success(`Added ${product.name}`);
  };

  const handleBarcodeScan = async (barcode: string) => {
    const res = await fetch(`/api/products/barcode/${barcode}`);
    const json = await res.json();
    if (json.success && json.data) {
      addProductToCart(json.data);
      setSearch("");
    } else {
      toast.error("Barcode not recognized");
    }
  };

  useKeyboardShortcuts({
    "ctrl+f": () => document.getElementById("pos-search")?.focus(),
    "ctrl+h": () => holdCart(),
    f2: () => setPaymentMethod("cash"),
    f3: () => setPaymentMethod("card"),
  });

  const [settings, setSettings] = useState<{
    storeName?: string;
    storeAddress?: string;
    storePhone?: string;
    invoiceFooter?: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((json) => {
        if (json?.success && json?.data) {
          setSettings(json.data);
        }
      })
      .catch(() => {});
  }, []);

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    setCheckoutLoading(true);
    try {
      const total = getTotal();
      const res = await fetch("/api/sales/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          discount,
          taxRate,
          payments: [{ method: paymentMethod, amount: total }],
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      printThermalReceipt({
        storeName: settings?.storeName || "My Store",
        storeAddress: settings?.storeAddress,
        storePhone: settings?.storePhone,
        footer: settings?.invoiceFooter,
        invoiceNumber: json.data.invoiceNumber,
        date: new Date().toLocaleString(),
        cashier: "Cashier",
        items,
        subtotal: getSubtotal(),
        discount,
        tax: getSubtotal() * (taxRate / 100),
        total,
        payments: [{ method: paymentMethod, amount: total }],
      });

      clearCart();
      toast.success("Sale completed successfully!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const totalItemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="grid h-[calc(100vh-7.5rem)] gap-4 lg:grid-cols-12">
      {/* Product Catalog & Search Column (7 of 12 cols on desktop) */}
      <div className="flex flex-col gap-3 lg:col-span-7 xl:col-span-8 overflow-hidden">
        {/* Search & Barcode Bar */}
        <div className="flex gap-2 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="pos-search"
              placeholder="Search bakery items by name, SKU or barcode (Ctrl+F)..."
              className="h-11 pl-10 pr-10 bg-white dark:bg-[#0f172a] border-slate-200/80 dark:border-slate-800 shadow-xs focus-visible:ring-lime-500 rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && search.trim().length >= 4) {
                  handleBarcodeScan(search.trim());
                }
              }}
              autoFocus
            />
            <Barcode className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
          {search && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearch("")}
              className="h-11 px-3 text-xs"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Bakery Category Quick-Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none shrink-0">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 shrink-0",
              selectedCategory === "all"
                ? "bg-lime-600 text-white shadow-xs dark:bg-lime-500 dark:text-slate-950 font-bold"
                : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-100 hover:text-slate-900 dark:bg-[#0f172a] dark:text-slate-400 dark:border-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              type="button"
              onClick={() => setSelectedCategory(cat._id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 shrink-0",
                selectedCategory === cat._id
                  ? "bg-lime-600 text-white shadow-xs dark:bg-lime-500 dark:text-slate-950 font-bold"
                  : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-100 hover:text-slate-900 dark:bg-[#0f172a] dark:text-slate-400 dark:border-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto rounded-xl border border-slate-200/70 bg-slate-50/50 p-3 dark:border-slate-800/80 dark:bg-[#0b1120]/40">
          {loading && products.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm font-medium text-slate-400 animate-pulse">Loading bakery items...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <Package className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No bakery items found
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Try selecting another category or searching with a different name, SKU, or barcode.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <button
                  key={product._id}
                  type="button"
                  onClick={() => addProductToCart(product)}
                  disabled={product.stock <= 0}
                  className="group relative flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-3 text-left transition-all hover:border-lime-500 hover:shadow-xs active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none dark:border-slate-800/90 dark:bg-[#0f172a] dark:hover:border-lime-500/80 dark:hover:bg-[#172033]/60"
                >
                  <div>
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <span className="line-clamp-2 text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">
                        {product.name}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
                      {product.sku}
                    </span>
                  </div>

                  <div className="mt-3 flex items-end justify-between border-t border-slate-100 dark:border-slate-800/60 pt-2">
                    <div>
                      <span className="text-xs text-slate-400 block -mb-0.5">Price</span>
                      <span className="text-base font-extrabold text-slate-900 dark:text-white">
                        {formatCurrency(product.sellingPrice)}
                      </span>
                    </div>
                    <Badge
                      variant={
                        product.stock <= 0
                          ? "destructive"
                          : product.stock <= 5
                          ? "warning"
                          : "secondary"
                      }
                      className="text-[10px] px-1.5 py-0 font-medium"
                    >
                      {product.stock <= 0 ? "Out" : `${product.stock} left`}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* POS Cart & Checkout Column (5 of 12 cols on desktop) */}
      <Card className="flex flex-col lg:col-span-5 xl:col-span-4 border-slate-200/90 shadow-xs dark:border-slate-800/90 dark:bg-[#0f172a] overflow-hidden">
        {/* Cart Header */}
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 p-3.5 bg-slate-50/70 dark:bg-[#172033]/60">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-lime-600 dark:text-lime-400" />
            <CardTitle className="text-base font-bold">
              Current Order
            </CardTitle>
            <Badge variant="secondary" className="font-semibold text-xs px-2 py-0.5">
              {totalItemCount} {totalItemCount === 1 ? "item" : "items"}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => holdCart()}
              title="Hold Cart (Ctrl+H)"
              className="h-8 px-2 text-xs text-slate-600 dark:text-slate-300"
            >
              <Pause className="mr-1 h-3.5 w-3.5" />
              Hold
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={clearCart}
              disabled={items.length === 0}
              title="Clear Cart"
              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        {/* Held Carts Notification Bar */}
        {heldCarts.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto bg-amber-50 px-3 py-1.5 border-b border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/40 shrink-0">
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 shrink-0">
              Held ({heldCarts.length}):
            </span>
            {heldCarts.map((h, idx) => (
              <Button
                key={h.id}
                variant="outline"
                size="sm"
                onClick={() => resumeCart(h.id)}
                className="h-6 px-2 text-[11px] bg-white border-amber-300 text-amber-900 hover:bg-amber-100 dark:bg-[#0f172a] dark:text-amber-300"
              >
                <Play className="mr-1 h-2.5 w-2.5 fill-current" />
                Hold #{idx + 1}
              </Button>
            ))}
          </div>
        )}

        {/* Cart Item List */}
        <CardContent className="flex flex-1 flex-col justify-between p-3.5 gap-3 overflow-hidden">
          <div className="flex-1 space-y-2 overflow-y-auto pr-1">
            {items.map((item) => (
              <div
                key={`${item.productId}-${item.variantId}`}
                className="group flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5 transition dark:border-slate-800/90 dark:bg-[#172033]/50"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {item.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {formatCurrency(item.price)} × {item.quantity} ={" "}
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </p>
                </div>

                {/* Quantity Buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 rounded-lg border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700"
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity - 1, item.variantId)
                    }
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-7 text-center text-sm font-bold font-mono">
                    {item.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 rounded-lg border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700"
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity + 1, item.variantId)
                    }
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-400 hover:text-red-500 ml-1"
                    onClick={() => removeItem(item.productId, item.variantId)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}

            {items.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                <ShoppingBag className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Cart is currently empty
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Click any bakery item on the left or scan barcode to add
                </p>
              </div>
            )}
          </div>

          {/* Cart Pricing & Actions Footer */}
          <div className="space-y-3 border-t border-slate-200/80 pt-3 dark:border-slate-800/80 shrink-0">
            {/* Discount & Calculations */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal</span>
                <span className="font-semibold">{formatCurrency(getSubtotal())}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Discount (Rs.)</span>
                <Input
                  type="number"
                  placeholder="0"
                  value={discount || ""}
                  onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                  className="h-7 w-24 text-right font-mono text-xs"
                />
              </div>
              {taxRate > 0 && (
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Tax ({taxRate}%)</span>
                  <span>{formatCurrency(getSubtotal() * (taxRate / 100))}</span>
                </div>
              )}
            </div>

            {/* Grand Total - High Hierarchy */}
            <div className="rounded-xl bg-slate-950 p-3.5 text-white dark:bg-[#080c14] dark:border dark:border-slate-700/80 shadow-md">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-slate-400">
                <span>Grand Total</span>
                <span className="rounded bg-lime-500/20 px-1.5 py-0.5 font-bold text-lime-400">
                  PKR
                </span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-extrabold tracking-tight text-white dark:text-lime-400">
                  {formatCurrency(getTotal())}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {totalItemCount} {totalItemCount === 1 ? "unit" : "units"}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className={`flex items-center justify-center gap-2 rounded-lg border py-2 text-xs font-bold transition-all ${
                  paymentMethod === "cash"
                    ? "border-lime-600 bg-lime-500/10 text-lime-800 dark:bg-lime-950/40 dark:text-lime-400 dark:border-lime-500/80 shadow-2xs"
                    : "border-slate-200/90 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-[#0f172a] dark:text-slate-300 dark:hover:bg-slate-800/80"
                }`}
              >
                <Banknote className="h-4 w-4" />
                Cash <span className="text-[10px] opacity-60 font-mono">(F2)</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={`flex items-center justify-center gap-2 rounded-lg border py-2 text-xs font-bold transition-all ${
                  paymentMethod === "card"
                    ? "border-lime-600 bg-lime-500/10 text-lime-800 dark:bg-lime-950/40 dark:text-lime-400 dark:border-lime-500/80 shadow-2xs"
                    : "border-slate-200/90 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-[#0f172a] dark:text-slate-300 dark:hover:bg-slate-800/80"
                }`}
              >
                <CreditCard className="h-4 w-4" />
                Card <span className="text-[10px] opacity-60 font-mono">(F3)</span>
              </button>
            </div>

            {/* Primary Action Button */}
            <Button
              className="h-12 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all active:scale-[0.99] disabled:opacity-40"
              onClick={handleCheckout}
              disabled={checkoutLoading || items.length === 0}
            >
              <Printer className="mr-2 h-4 w-4" />
              {checkoutLoading ? "Processing Sale..." : "Pay & Print Invoice"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
