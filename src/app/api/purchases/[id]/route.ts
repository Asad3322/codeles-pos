import { connectDB } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth-helpers";
import { hasPermission } from "@/lib/permissions";
import { PurchaseService } from "@/services/purchase.service";

const service = new PurchaseService();

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const allowed =
      hasPermission(session.user.role, "purchases.view") ||
      hasPermission(session.user.role, "purchases.manage");
    if (!allowed) {
      return apiError("Forbidden", 403);
    }

    await connectDB();
    const { id } = await params;
    const purchase = await service.getById(id);
    return apiSuccess(purchase);
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load purchase details", 400);
  }
}
