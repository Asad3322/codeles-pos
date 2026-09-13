import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { getDefaultRouteForRole } from "@/lib/permissions";
import { User } from "@/models/User";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    redirect(getDefaultRouteForRole(session.user.role));
  }

  await connectDB();

  const adminExists = await User.exists({
    role: "admin",
  });

  if (!adminExists) {
    redirect("/setup");
  }

  redirect("/login");
}
