import { auth } from "@/auth";
import { getDefaultRouteForRole } from "@/lib/permissions";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  redirect(getDefaultRouteForRole(session.user.role));
}
