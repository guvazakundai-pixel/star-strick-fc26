import { db } from "@/lib/db";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RankingsClient } from "@/components/RankingsNew";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Rankings · ZIM FCPRO",
  description: "Live rankings for Zimbabwe's competitive EA Sports FC season.",
};

export default async function RankingsPage() {
  return <RankingsClient />;
}