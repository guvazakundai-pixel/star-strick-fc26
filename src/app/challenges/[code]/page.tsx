import { db } from "@/lib/db";
import { getChallengeByCode } from "@/lib/challenge-service";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ChallengeLobbyClient } from "@/components/ChallengeLobbyClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Challenge Lobby · ZimFC Pro" };

export default async function ChallengePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const challenge = await getChallengeByCode(code);

  return (
    <ErrorBoundary scope="challenge">
      <ChallengeLobbyClient code={code} initialChallenge={challenge} />
    </ErrorBoundary>
  );
}