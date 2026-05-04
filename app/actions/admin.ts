'use server'

import { PrismaClient, Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { getServerSession } from '@/lib/auth'

const prisma = new PrismaClient()

export async function addPointsAction(formData: FormData) {
  const session = await getServerSession()
  if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.role))
    return { error: 'Unauthorized' }

  const userId = formData.get('userId') as string
  const points = parseInt(formData.get('points') as string)
  const reason = formData.get('reason') as Prisma.PointsReason
  const note = formData.get('note') as string

  if (!userId || isNaN(points) || !reason)
    return { error: 'Missing required fields' }

  try {
    await prisma.$transaction([
      prisma.pointsLog.create({
        data: {
          userId,
          adminId: session.userId,
          pointsChange: points,
          reason: reason as any,
          reasonText: note,
        }
      }),
      prisma.playerStats.upsert({
        where: { userId },
        update: { points: { increment: points } },
        create: { userId, points: points }
      }),
      prisma.user.update({
        where: { id: userId },
        data: { isVerified: true }
      })
    ])

    revalidatePath('/admin')
    revalidatePath('/rankings')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function uploadCSVAction(formData: FormData) {
  const session = await getServerSession()
  if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.role))
    return { error: 'Unauthorized' }

  const file = formData.get('file') as File
  if (!file) return { error: 'No file provided' }

  try {
    const text = await file.text()
    const lines = text.split('\n').filter(l => l.trim())
    let count = 0

    for (const line of lines.slice(1)) { // skip header
      const [fcUsername, points, reason] = line.split(',')
      if (!fcUsername || isNaN(Number(points))) continue

      const user = await prisma.user.findFirst({ where: { fcUsername: fcUsername.trim() } })
      if (!user) continue

      await prisma.$transaction([
        prisma.pointsLog.create({
          data: {
            userId: user.id,
            adminId: session.userId,
            pointsChange: Number(points),
            reason: (reason?.trim() || 'BULK_UPLOAD') as any,
          }
        }),
        prisma.playerStats.upsert({
          where: { userId: user.id },
          update: { points: { increment: Number(points) } },
          create: { userId: user.id, points: Number(points) }
        })
      ])
      count++
    }

    revalidatePath('/admin')
    revalidatePath('/rankings')
    return { success: true, count }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function toggleBanUser(userId: string, ban: boolean) {
  const session = await getServerSession()
  if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.role))
    return { error: 'Unauthorized' }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { isBanned: ban }
    })
    revalidatePath('/admin')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function verifyClubAction(clubId: string) {
  const session = await getServerSession()
  if (!session || !['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(session.role))
    return { error: 'Unauthorized' }

  try {
    await prisma.club.update({
      where: { id: clubId },
      data: { isVerified: true, status: 'VERIFIED' }
    })
    revalidatePath('/admin')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}
