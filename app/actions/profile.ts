'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { getServerSession } from '@/lib/auth'

const prisma = new PrismaClient()

export async function updateProfileAction(formData: FormData) {
  const session = await getServerSession()
  if (!session) return { error: 'Unauthorized' }

  const displayName = formData.get('displayName') as string
  const platform = formData.get('platform') as string

  if (!displayName || displayName.length < 3 || displayName.length > 30)
    return { error: 'Display name must be 3-30 characters' }

  try {
    await prisma.user.update({
      where: { id: session.userId },
      data: { displayName, platform: platform as any }
    })
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function requestClubChangeAction(formData: FormData) {
  const session = await getServerSession()
  if (!session) return { error: 'Unauthorized' }

  const action = formData.get('action') as string

  try {
    if (action === 'leave') {
      await prisma.user.update({
        where: { id: session.userId },
        data: { clubId: null }
      })
    } else if (action === 'join') {
      const clubId = formData.get('clubId') as string
      await prisma.user.update({
        where: { id: session.userId },
        data: { clubId }
      })
    } else if (action === 'new') {
      const clubName = formData.get('clubName') as string
      const clubTag = formData.get('clubTag') as string
      // In production, this would go through an approval process
      const slug = clubName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      const club = await prisma.club.create({
        data: {
          name: clubName,
          slug,
          tag: clubTag,
          city: 'Unknown',
          managerId: session.userId,
          status: 'PENDING'
        }
      })
      await prisma.user.update({
        where: { id: session.userId },
        data: { clubId: club.id }
      })
    }
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}
