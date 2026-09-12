import { connectDB } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth, requirePermission } from "@/lib/auth-helpers";
import { hasPermission } from "@/lib/permissions";
import { zodFirstError } from "@/lib/zod-error";
import { ingredientSchema } from "@/validations/ingredient.schema";
import { IngredientService } from "@/services/ingredient.service";

const service = new IngredientService();

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const allowed =
      hasPermission(session.user.role, "ingredients.view") ||
      hasPermission(session.user.role, "inventory.manage");
    if (!allowed) {
      return apiError("Forbidden", 403);
    }

    await connectDB();
    const { id } = await params;
    const data = await service.getById(id);
    return apiSuccess(data);
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load ingredient", 400);
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("ingredients.manage");
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const partialSchema = ingredientSchema.partial();
    const parsed = partialSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(zodFirstError(parsed.error));
    }

    const updated = await service.update(id, parsed.data);
    return apiSuccess(updated, "Ingredient updated successfully");
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to update ingredient", 400);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("ingredients.manage");
    await connectDB();
    const { id } = await params;
    const deleted = await service.softDelete(id);
    return apiSuccess(deleted, "Ingredient deactivated successfully");
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to delete ingredient", 400);
  }
}
