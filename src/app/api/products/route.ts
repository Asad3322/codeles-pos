import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth, requirePermission } from "@/lib/auth-helpers";
import { hasPermission } from "@/lib/permissions";
import { generateSKU } from "@/lib/utils";
import { Product } from "@/models/Product";
import { ProductRepository } from "@/repositories/product.repository";
import { zodFirstError } from "@/lib/zod-error";
import { productSchema } from "@/validations/product.schema";

const repo = new ProductRepository();

export async function GET(req: Request) {
  try {
    const session = await requireAuth();
    const allowed =
      hasPermission(session.user.role, "products.manage") ||
      hasPermission(session.user.role, "pos.access");
    if (!allowed) {
      return apiError("Forbidden", 403);
    }
    await connectDB();
    const { searchParams } = new URL(req.url);
    const result = await repo.paginate({
      page: Number(searchParams.get("page") ?? 1),
      limit: Number(searchParams.get("limit") ?? 20),
      search: searchParams.get("search") ?? undefined,
      categoryId: searchParams.get("categoryId") ?? undefined,
    });
    return apiSuccess(result);
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed", 401);
  }
}

export async function POST(req: Request) {
  try {
    await requirePermission("products.manage");
    await connectDB();
    const body = await req.json();
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(zodFirstError(parsed.error));
    }

    const data = parsed.data;
    const slug = data.name.toLowerCase().replace(/\s+/g, "-");
    let sku = data.sku?.trim();
    if (!sku) {
      let candidate = generateSKU("BAK", data.name);
      let attempts = 0;
      while ((await Product.exists({ sku: candidate })) && attempts < 10) {
        candidate = generateSKU("BAK", data.name);
        attempts++;
      }
      sku = candidate;
    }
    const barcode = data.barcode?.trim() ? data.barcode.trim() : undefined;

    const product = await repo.create({
      name: data.name,
      slug,
      sku,
      barcode,
      description: data.description,
      categoryId: new mongoose.Types.ObjectId(data.categoryId),
      brandId: data.brandId ? new mongoose.Types.ObjectId(data.brandId) : undefined,
      branchId: data.branchId ? new mongoose.Types.ObjectId(data.branchId) : undefined,
      costPrice: data.costPrice,
      sellingPrice: data.sellingPrice,
      taxRate: data.taxRate,
      stock: data.stock,
      lowStockThreshold: data.lowStockThreshold,
      unit: data.unit || "pcs",
      images: data.images ?? [],
    });
    return apiSuccess(product, "Bakery item created", 201);
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed", 400);
  }
}
