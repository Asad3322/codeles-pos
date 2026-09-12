import { Ingredient, type IIngredient } from "@/models/Ingredient";
import type { PaginationParams, PaginatedResult } from "@/types";

export interface IngredientFilterParams extends PaginationParams {
  category?: string;
  status?: "all" | "in_stock" | "low_stock" | "out_of_stock";
  branchId?: string;
}

export class IngredientRepository {
  async findById(id: string) {
    return Ingredient.findById(id)
      .populate("preferredSupplierId", "name company phone")
      .lean();
  }

  async findByCode(code: string) {
    return Ingredient.findOne({ code }).lean();
  }

  async paginate(params: IngredientFilterParams): Promise<PaginatedResult<IIngredient>> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = { isActive: true };

    if (params.search) {
      const regex = { $regex: params.search, $options: "i" };
      filter.$or = [{ name: regex }, { code: regex }];
    }

    if (params.category && params.category !== "all") {
      filter.category = params.category;
    }

    if (params.branchId) {
      filter.branchId = params.branchId;
    }

    if (params.status === "low_stock") {
      filter.$expr = {
        $and: [
          { $gt: ["$stockInBaseUnit", 0] },
          { $lte: ["$stockInBaseUnit", "$minimumStockInBaseUnit"] },
        ],
      };
    } else if (params.status === "out_of_stock") {
      filter.stockInBaseUnit = { $lte: 0 };
    } else if (params.status === "in_stock") {
      filter.$expr = { $gt: ["$stockInBaseUnit", "$minimumStockInBaseUnit"] };
    }

    const [items, total] = await Promise.all([
      Ingredient.find(filter)
        .populate("preferredSupplierId", "name company")
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Ingredient.countDocuments(filter),
    ]);

    return {
      items: items as IIngredient[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getLowStock(branchId?: string) {
    const filter: Record<string, unknown> = {
      isActive: true,
      $expr: { $lte: ["$stockInBaseUnit", "$minimumStockInBaseUnit"] },
    };
    if (branchId) filter.branchId = branchId;

    return Ingredient.find(filter)
      .populate("preferredSupplierId", "name phone")
      .sort({ stockInBaseUnit: 1 })
      .limit(50)
      .lean();
  }
}
