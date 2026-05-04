import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const field = searchParams.get('field')
  const value = searchParams.get('value')

  if (!field || !value)
    return NextResponse.json({ error: 'Missing field or value' }, { status: 400 })

  try {
    let available = false
    if (field === 'fcUsername') {
      const existing = await prisma.user.findFirst({
        where: { fcUsername: value }
      })
      available = !existing
    } else if (field === 'email') {
      const existing = await prisma.user.findUnique({
        where: { email: value }
      })
      available = !existing
    }
    return NextResponse.json({ available })
  } catch {
    return NextResponse.json({ error: 'Check failed' }, { status: 500 })
  }
}
