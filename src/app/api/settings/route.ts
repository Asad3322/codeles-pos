import { connectDB } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAuth, requirePermission } from "@/lib/auth-helpers";
import { Settings } from "@/models/Settings";
import { settingsSchema } from "@/validations/settings.schema";

export async function GET() {
  try {
    await requireAuth();
    await connectDB();

    const settings = await Settings.findOne().lean();
    if (settings) {
      return apiSuccess({
        ...settings,
        currency: "PKR",
        currencySymbol: "Rs.",
      });
    }

    return apiSuccess({
      storeName: "Codeles POS Store",
      storeAddress: "",
      storePhone: "",
      storeEmail: "",
      logo: "",
      currency: "PKR",
      currencySymbol: "Rs.",
      taxRate: 0,
      taxName: "VAT",
      language: "en",
      invoicePrefix: "INV",
      invoiceFooter: "",
      lowStockAlert: true,
      theme: "system",
    });
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Failed to load settings", 401);
  }
}

export async function PUT(req: Request) {
  try {
    await requirePermission("settings.manage");
    await connectDB();

    const body = await req.json();
    const dataToValidate = {
      ...body,
      currency: "PKR",
      currencySymbol: "Rs.",
    };
    const parsed = settingsSchema.safeParse(dataToValidate);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? "Invalid settings data");
    }

    await Settings.updateOne({}, parsed.data, { upsert: true });
    const updated = await Settings.findOne().lean();

    return apiSuccess(updated ?? parsed.data, "Settings saved");
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Failed to save settings", 400);
  }
}
