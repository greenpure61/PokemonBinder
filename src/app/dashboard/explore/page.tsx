import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { ExploreContent } from "./ExploreContent";

export default async function ExplorePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return <ExploreContent />;
}
