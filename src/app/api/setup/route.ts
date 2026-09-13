import bcrypt from "bcryptjs";

import { connectDB } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { zodFirstError } from "@/lib/zod-error";
import { Branch } from "@/models/Branch";
import { Settings } from "@/models/Settings";
import { User } from "@/models/User";
import { setupSchema } from "@/validations/setup.schema";

export async function GET() {
  try {
    await connectDB();

    const adminExists = await User.exists({ role: "admin" });

    return apiSuccess({
      initialized: Boolean(adminExists),
    });
  } catch (error) {
    console.error("[Setup] status error:", error);
    return apiError("Failed to check setup status", 500);
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();

    // Never allow first-time setup after an administrator already exists.
    const existingAdmin = await User.exists({ role: "admin" });

    if (existingAdmin) {
      return apiError("Codeles POS has already been initialized", 409);
    }

    const body = await req.json();
    const parsed = setupSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(zodFirstError(parsed.error));
    }

    const {
      bakeryName,
      ownerName,
      email,
      password,
      phone,
      address,
    } = parsed.data;

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.exists({ email: normalizedEmail });

    if (existingUser) {
      return apiError("A user with this email already exists", 409);
    }

    const branch = await Branch.create({
      name: "Main Branch",
      code: "MAIN",
      address: address || undefined,
      phone: phone || undefined,
      email: normalizedEmail,
      isMain: true,
      isActive: true,
    });

    try {
      await Settings.create({
        storeName: bakeryName,
        storeAddress: address || undefined,
        storePhone: phone || undefined,
        storeEmail: normalizedEmail,
        currency: "PKR",
        currencySymbol: "Rs.",
        taxRate: 0,
        taxName: "Tax",
        language: "en",
        invoicePrefix: "INV",
        lowStockAlert: true,
        theme: "system",
        branchId: branch._id,
      });

      const hashedPassword = await bcrypt.hash(password, 12);

      const owner = await User.create({
        name: ownerName,
        email: normalizedEmail,
        password: hashedPassword,
        role: "admin",
        branchId: branch._id,
        isActive: true,
      });

      return apiSuccess(
        {
          initialized: true,
          ownerId: owner._id.toString(),
          branchId: branch._id.toString(),
        },
        "Codeles POS setup completed",
        201
      );
    } catch (error) {
      // Compensate for a partially created setup.
      await Settings.deleteMany({ branchId: branch._id });
      await User.deleteMany({ branchId: branch._id });
      await Branch.deleteOne({ _id: branch._id });
      throw error;
    }
  } catch (error) {
    console.error("[Setup] initialization error:", error);

    return apiError(
      error instanceof Error ? error.message : "Setup failed",
      500
    );
  }
}
