import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { BinderEditor } from "./BinderEditor";

type Props = { params: Promise<{ binderId: string }> };

export default async function BinderEditorPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { binderId } = await params;
  return <BinderEditor binderId={binderId} />;
}
