import { prisma } from "./prisma";

export type AuditAction =
  | "CLUB_UPDATE"
  | "MEMBER_APPROVE"
  | "MEMBER_REJECT"
  | "MEMBER_PROMOTE"
  | "MEMBER_REMOVE"
  | "RANKING_REORDER"
  | "MEDIA_UPLOAD"
  | "MEDIA_DELETE"
  | "RANK_RECOMPUTE"
  | "MATCH_CONFIRM"
  | "MATCH_APPROVE"
  | "MATCH_DISPUTE"
  | "MATCH_REQUEST_ACCEPT"
  | "MATCH_REQUEST_DECLINE"
  | "MATCH_REQUEST_CANCEL";

export async function audit(
  adminId: string,
  action: AuditAction,
  target: string,
  details?: Record<string, unknown>,
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      adminId,
      action,
      target,
      details: details ?? undefined,
    },
  });
}