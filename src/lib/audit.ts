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
  | "RANK_RECOMPUTE";

export type AuditEntity = "CLUB" | "CLUB_MEMBER" | "CLUB_RANKING" | "MEDIA" | "USER";

export async function audit(
  actorId: string,
  actionType: AuditAction,
  entityType: AuditEntity,
  entityId: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId,
      actionType,
      entityType,
      entityId,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
}
