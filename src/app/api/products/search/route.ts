import { connectDB } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth-helpers";
import { ProductRepository } from "@/repositories/product.repository";

const repo = new ProductRepository();

export async function GET(req: Request) {
  try {
    await requireAuth();
    await connectDB();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? "";
    const categoryId = searchParams.get("categoryId") ?? undefined;
    const products = q ? await repo.search(q, 24, categoryId) : [];
    return apiSuccess(products);
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Search failed", 401);
  }
}
