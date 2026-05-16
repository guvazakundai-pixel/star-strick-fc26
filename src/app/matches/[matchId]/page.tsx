import { MatchDetailClient } from "@/components/match/MatchDetailClient";

export const dynamic = "force-dynamic";

export default async function MatchDetailPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  return <MatchDetailClient matchId={matchId} />;
}
