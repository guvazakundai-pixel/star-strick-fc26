import { ClubsTable } from "@/components/ClubsTable";

export default function ClubsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <header className="mb-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
          Clubs
        </p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
          Club Standings
        </h1>
        <p className="mt-1 text-sm text-muted">
          Season 1 league table for every registered Zimbabwean club.
        </p>
      </header>
      <ClubsTable />
    </div>
  );
}
