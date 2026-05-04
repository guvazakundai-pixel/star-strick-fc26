'use server'

import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

export async function getPlayers({
  page = 1,
  limit = 20,
  search = '',
  platform = '',
}: {
  page?: number
  limit?: number
  search?: string
  platform?: string
}) {
  const skip = (page -1) * limit
  const where: Prisma.UserWhereInput = {
    isBanned: false,
    isVerified: true,
    playerStats: { isNot: null }
  }
  if (search) where.fcUsername = { contains: search, mode: 'insensitive' }
  if (platform) where.platform = platform as Prisma.Platform

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { playerStats: true, club: { select: { id: true, name: true, tag: true } } },
      orderBy: { playerStats: { points: 'desc' } },
      skip,
      take: limit,
    }),
    prisma.user.count({ where })
  ])

  const data = users.map((u, i) => ({
    rank: skip + i + 1,
    id: u.id,
    fcUsername: u.fcUsername,
    displayName: u.displayName,
    platform: u.platform,
    points: u.playerStats?.points || 0,
    club: u.club,
  }))

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export async function getClubs() {
  return prisma.club.findMany({
    where: { isBanned: false },
    select: { id: true, name: true, tag: true },
    orderBy: { name: 'asc' }
  })
}
