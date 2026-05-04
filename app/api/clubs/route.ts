import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const approved = searchParams.get('approved') === 'true'

  try {
    const clubs = await prisma.club.findMany({
      where: approved ? { status: 'VERIFIED' } : {},
      select: { id: true, name: true, tag: true, logoUrl: true },
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(clubs)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch clubs' }, { status: 500 })
  }
}
