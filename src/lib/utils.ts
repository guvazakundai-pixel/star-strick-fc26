import { prisma } from "@/lib/db"

export async function logActivity(userId: string, action: string, metadata?: Record<string, unknown>) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        actionType: action as any,
        metadata: metadata ?? {},
      },
    })
  } catch {}
}

export async function notifyUser(userId: string, type: string, title: string, message: string, link?: string) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type: type as any,
        title,
        message,
        link: link ?? null,
      },
    })
  } catch {}
}

export async function auditAction(adminId: string, action: string, target: string, details?: Record<string, unknown>) {
  try {
    await prisma.auditLog.create({
      data: {
        adminId,
        action,
        target,
        details: details ?? {},
      },
    })
  } catch {}
}

export async function updateSystemHealth(metric: string, value: number, label: string) {
  try {
    await prisma.systemHealth.upsert({
      where: { metric },
      update: { value, label },
      create: { metric, value, label },
    })
  } catch {}
}
