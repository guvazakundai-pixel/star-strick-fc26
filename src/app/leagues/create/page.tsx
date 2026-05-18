import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import CreateLeagueForm from "./CreateLeagueForm";

export default async function CreateLeaguePage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/leagues/create");

  return (
    <div className="broadcast-theme min-h-screen bc-noise">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
        <a
          href="/leagues"
          className="text-muted-soft hover:text-ink text-xs font-mono uppercase tracking-wider transition-colors inline-flex items-center gap-1 mb-4"
        >
          ← Back to Leagues
        </a>
        <h1 className="cinematic-heading text-3xl text-ink mb-2">Create League</h1>
        <p className="text-muted-soft text-sm mb-6">
          Set the rules. Generate fixtures. Authenticate results. You're the commissioner.
        </p>
        <CreateLeagueForm />
      </div>
    </div>
  );
}
