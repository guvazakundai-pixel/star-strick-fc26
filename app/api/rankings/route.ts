import { PrismaClient, Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const search = searchParams.get('search') || ''
  const platform = searchParams.get('platform') || ''
  const clubId = searchParams.get('clubId') || ''
  const dateFrom = searchParams.get('dateFrom') || ''
  const dateTo = searchParams.get('dateTo') || ''
  const type = searchParams.get('type') || 'players' // 'players' or 'clubs'

  const skip = (page - 1) * limit

  try {
    if (type === 'clubs') {
      // Club rankings - sum of member points
      const clubs = await prisma.$queryRaw<Array<{
        id: string,
        name: string,
        tag: string | null,
        logoUrl: string | null,
        totalPoints: bigint,
        memberCount: bigint,
        rank: bigint
      }>>`
        SELECT 
          c.id, c.name, c.tag, c."logo_url" as "logoUrl",
          COALESCE(SUM(ps.points), 0) as "totalPoints",
          COUNT(DISTINCT cm."user_id") as "memberCount",
          ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(ps.points), 0) DESC) as rank
        FROM clubs c
        LEFT JOIN club_members cm ON c.id = cm.club_id AND cm.status = 'APPROVED'
        LEFT JOIN player_stats ps ON cm."user_id" = ps."user_id"
        WHERE c."is_banned" = false
        GROUP BY c.id, c.name, c.tag, c."logo_url"
        ORDER BY "totalPoints" DESC
        LIMIT ${limit} OFFSET ${skip}
      `
      return NextResponse.json({
        data: clubs.map(c => ({
          ...c,
          totalPoints: Number(c.totalPoints),
          memberCount: Number(c.memberCount),
          rank: Number(c.rank)
        })),
        page,
        limit,
        type: 'clubs'
      })
    }

    // Player rankings
    const where: Prisma.UserWhereInput = {
      isBanned: false,
      isVerified: true,
      playerStats: { isNot: null }
    }
    if (search) where.fcUsername = { contains: search, mode: 'insensitive' }
    if (platform) where.platform = platform as Prisma.Platform
    if (clubId) where.clubId = clubId
    if (dateFrom || dateTo) {
      where.createdAt = {
        gte: dateFrom ? new Date(dateFrom) : undefined,
        lte: dateTo ? new Date(dateTo) : undefined,
      }
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          playerStats: true,
          club: { select: { id: true, name: true, tag: true } }
        },
        orderBy: { playerStats: { points: 'desc' } },
        skip,
        take: limit,
      }),
      prisma.user.count({ where })
    ])

    const ranked = users.map((u, i) => ({
      rank: skip + i + 1,
      id: u.id,
      fcUsername: u.fcUsername,
      displayName: u.displayName,
      platform: u.platform,
      points: u.playerStats?.points || 0,
      club: u.club,
    }))

    return NextResponse.json({
      data: ranked,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      type: 'players'
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
