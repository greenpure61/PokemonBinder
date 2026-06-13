import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { StatsContent } from "./StatsContent";

export default async function StatsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return <StatsContent />;
}
