import { TournamentListClient } from "@/components/tournaments/TournamentListClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tournaments · Star Strick FC26",
  description: "Compete in ZW tournaments — knockout, round-robin, city-based, and more.",
};

export default function TournamentsPage() {
  return (
    <div className="broadcast-theme min-h-screen bc-grain">
      <TournamentListClient />
    </div>
  );
}
