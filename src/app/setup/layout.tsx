import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { redirect } from "next/navigation";

export default async function SetupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connectDB();

  const adminExists = await User.exists({
    role: "admin",
  });

  if (adminExists) {
    redirect("/login");
  }

  return children;
}
