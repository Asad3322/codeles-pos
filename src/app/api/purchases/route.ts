import { connectDB } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth, requirePermission } from "@/lib/auth-helpers";
import { hasPermission } from "@/lib/permissions";
import { zodFirstError } from "@/lib/zod-error";
import { purchaseSchema } from "@/validations/purchase.schema";
import { PurchaseService } from "@/services/purchase.service";

const service = new PurchaseService();

export async function GET(req: Request) {
  try {
    const session = await requireAuth();
    const allowed =
      hasPermission(session.user.role, "purchases.view") ||
      hasPermission(session.user.role, "purchases.manage");
    if (!allowed) {
      return apiError("Forbidden", 403);
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const result = await service.list({
      page: Number(searchParams.get("page") ?? 1),
      limit: Number(searchParams.get("limit") ?? 20),
      search: searchParams.get("search") ?? undefined,
    });
    return apiSuccess(result);
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load purchases", 401);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requirePermission("purchases.manage");
    await connectDB();
    const body = await req.json();

    const parsed = purchaseSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(zodFirstError(parsed.error));
    }

    const purchase = await service.createPurchase(parsed.data, session.user.id);
    return apiSuccess(purchase, "Purchase recorded successfully", 201);
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to record purchase", 400);
  }
}
