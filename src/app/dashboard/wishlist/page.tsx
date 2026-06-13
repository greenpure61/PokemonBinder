import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { WishlistContent } from "./WishlistContent";

export default async function WishlistPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return <WishlistContent />;
}
