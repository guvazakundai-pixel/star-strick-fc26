import { requireRole } from "@/lib/route-auth";
import { getDisputedChallenges } from "@/lib/challenge-service";
import { redirect } from "next/navigation";
import { AdminDisputesClient } from "@/components/AdminDisputesClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "Dispute Resolution · ZimFC Pro Admin" };

export default async function AdminDisputesPage() {
  const disputes = await getDisputedChallenges();
  return <AdminDisputesClient disputes={disputes} />;
}