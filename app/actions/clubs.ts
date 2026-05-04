'use server'

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function getClubs() {
  return prisma.club.findMany({
    where: { isBanned: false },
    select: {
      id: true,
      name: true,
      tag: true,
      logoUrl: true,
      _count: { select: { members: { where: { status: 'APPROVED' } } }
    },
    orderBy: { name: 'asc' }
  })
}
