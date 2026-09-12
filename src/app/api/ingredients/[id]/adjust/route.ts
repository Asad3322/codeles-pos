import { connectDB } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth-helpers";
import { zodFirstError } from "@/lib/zod-error";
import { ingredientAdjustSchema } from "@/validations/ingredient.schema";
import { IngredientService } from "@/services/ingredient.service";

const service = new IngredientService();

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("ingredients.adjust");
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const parsed = ingredientAdjustSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(zodFirstError(parsed.error));
    }

    const result = await service.adjustStock(id, parsed.data, session.user.id);
    return apiSuccess(result, "Ingredient stock adjusted successfully");
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Stock adjustment failed", 400);
  }
}
