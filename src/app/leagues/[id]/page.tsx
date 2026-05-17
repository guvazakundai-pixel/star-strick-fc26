import { LeagueDetailClient } from "@/components/LeagueDetailClient";

export const dynamic = "force-dynamic";

export default function LeagueDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="broadcast-theme min-h-screen bc-grain">
      <LeagueDetailClient leagueId={params.id} />
    </div>
  );
}
