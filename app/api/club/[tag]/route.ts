import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { tag: string } }
) {
  try {
    const club = await prisma.club.findUnique({
      where: { tag: params.tag },
      include: {
        manager: { select: { id: true, displayName: true, fcUsername: true } },
        members: {
          include: { user: { include: { playerStats: true } } },
          orderBy: { joinedAt: 'asc' }
        },
        globalRank: true,
      }
    })

    if (!club) return NextResponse.json({ error: 'Club not found' }, { status: 404 })

    const totalPoints = club.members.reduce((sum, m) => sum + (m.user.playerStats?.points || 0), 0)
    const avgPoints = club.members.length > 0 ? Math.round(totalPoints / club.members.length) : 0

    return NextResponse.json({
      ...club,
      totalPoints,
      avgPoints,
      memberCount: club.members.length,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
