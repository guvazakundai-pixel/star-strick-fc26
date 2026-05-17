import { TournamentListClient } from "@/components/tournaments/TournamentListClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tournaments · ZIM FCPRO",
  description: "Compete in ZW tournaments — knockout, round-robin, city-based, and more.",
};

export default function TournamentsPage() {
  return (
    <div className="broadcast-theme min-h-screen bc-grain">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
        <TournamentListClient />
      </div>
    </div>
  );
}
