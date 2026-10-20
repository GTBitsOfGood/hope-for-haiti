import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasPermission, isStaff } from "@/lib/userUtils";
import PricebookScreen from "@/screens/PricebookScreen";

export default async function PricebookPage() {
  const session = await auth();
  if (!session?.user) redirect("/signIn");
  if (!isStaff(session.user.type) || !hasPermission(session.user, "offerWrite")) redirect("/");
  return <PricebookScreen />;
}
