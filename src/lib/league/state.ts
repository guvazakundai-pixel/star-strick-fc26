export type FixtureStatus =
  | "SCHEDULED"
  | "SUBMITTED"
  | "CONFIRMED"
  | "AUTHENTICATED"
  | "DISPUTED"
  | "VOID";

export type FixtureRole = "HOME" | "AWAY" | "OWNER" | "OTHER";

export function roleFor(
  userId: string,
  fixture: { homeId: string; awayId: string },
  isOwner: boolean,
): FixtureRole {
  if (isOwner) return "OWNER";
  if (userId === fixture.homeId) return "HOME";
  if (userId === fixture.awayId) return "AWAY";
  return "OTHER";
}

export function canSubmit(status: FixtureStatus, role: FixtureRole): boolean {
  if (role !== "HOME" && role !== "AWAY") return false;
  return status === "SCHEDULED" || status === "SUBMITTED" || status === "DISPUTED";
}

export function canConfirm(
  status: FixtureStatus,
  role: FixtureRole,
  submitterId: string | null,
  userId: string,
): boolean {
  if (status !== "SUBMITTED") return false;
  if (role !== "HOME" && role !== "AWAY") return false;
  return submitterId !== null && submitterId !== userId;
}

export function canAuthenticate(status: FixtureStatus, role: FixtureRole): boolean {
  if (role !== "OWNER") return false;
  return status === "CONFIRMED" || status === "DISPUTED" || status === "SUBMITTED";
}

export function canDispute(
  status: FixtureStatus,
  role: FixtureRole,
  submitterId: string | null,
  userId: string,
): boolean {
  if (status !== "SUBMITTED") return false;
  if (role !== "HOME" && role !== "AWAY") return false;
  return submitterId !== null && submitterId !== userId;
}
