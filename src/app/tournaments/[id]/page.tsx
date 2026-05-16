import { TournamentDetailClient } from "@/components/tournaments/TournamentDetailClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `Tournament · Star Strick FC26` };
}

export default async function TournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="broadcast-theme min-h-screen bc-grain">
      <TournamentDetailClient tournamentId={id} />
    </div>
  );
}
