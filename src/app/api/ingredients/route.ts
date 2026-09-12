import { connectDB } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth, requirePermission } from "@/lib/auth-helpers";
import { hasPermission } from "@/lib/permissions";
import { zodFirstError } from "@/lib/zod-error";
import { ingredientSchema } from "@/validations/ingredient.schema";
import { IngredientService } from "@/services/ingredient.service";

const service = new IngredientService();

export async function GET(req: Request) {
  try {
    const session = await requireAuth();
    const allowed =
      hasPermission(session.user.role, "ingredients.view") ||
      hasPermission(session.user.role, "inventory.manage");
    if (!allowed) {
      return apiError("Forbidden", 403);
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const result = await service.list({
      page: Number(searchParams.get("page") ?? 1),
      limit: Number(searchParams.get("limit") ?? 20),
      search: searchParams.get("search") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      status: (searchParams.get("status") as never) ?? undefined,
    });
    return apiSuccess(result);
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load ingredients", 401);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requirePermission("ingredients.manage");
    await connectDB();
    const body = await req.json();
    const parsed = ingredientSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(zodFirstError(parsed.error));
    }

    const ingredient = await service.create(parsed.data, session.user.id);
    return apiSuccess(ingredient, "Ingredient created successfully", 201);
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to create ingredient", 400);
  }
}
