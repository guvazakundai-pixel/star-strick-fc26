import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'change-this-to-a-secure-random-string-in-production')

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const displayName = formData.get('displayName') as string
    const fcUsername = formData.get('fcUsername') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const platform = formData.get('platform') as string
    const clubOption = formData.get('clubOption') as string
    const clubId = formData.get('clubId') as string
    const clubName = formData.get('clubName') as string
    const clubTag = formData.get('clubTag') as string
    const clubLogo = formData.get('clubLogo') as File | null

    // Validate
    if (!displayName || displayName.length < 3 || displayName.length > 30)
      return NextResponse.json({ error: 'Display name must be 3-30 characters' }, { status: 400 })
    if (!fcUsername || fcUsername.length < 3 || fcUsername.length > 20)
      return NextResponse.json({ error: 'EA FC Username must be 3-20 characters' }, { status: 400 })
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    if (!password || password.length < 8)
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    if (!platform)
      return NextResponse.json({ error: 'Platform is required' }, { status: 400 })

    // Check uniqueness
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { fcUsername }] }
    })
    if (existingUser)
      return NextResponse.json({ error: existingUser.email === email ? 'Email already taken' : 'FC Username already taken' }, { status: 400 })

    // Handle club creation
    let finalClubId: string | undefined = undefined
    if (clubOption === 'existing' && clubId) {
      finalClubId = clubId
    } else if (clubOption === 'new' && clubName && clubTag) {
      let logoUrl: string | undefined = undefined
      if (clubLogo) {
        // TODO: upload to Cloudinary
        logoUrl = `https://via.placeholder.com/150?text=${encodeURIComponent(clubTag)}`
      }
      const slug = clubName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      const club = await prisma.club.create({
        data: {
          name: clubName,
          slug,
          tag: clubTag,
          logoUrl,
          city: 'Unknown',
          managerId: '', // Will update after user creation
          status: 'PENDING',
          createdByUserId: '', // Will update after user creation
        }
      })
      finalClubId = club.id
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        displayName,
        username: fcUsername,
        fcUsername,
        email,
        passwordHash,
        platform: platform as Prisma.Platform,
        clubId: finalClubId,
        isVerified: false,
      }
    })

    // Update club with manager and creator
    if (finalClubId && clubOption === 'new') {
      await prisma.club.update({
        where: { id: finalClubId },
        data: { managerId: user.id, createdByUserId: user.id }
      })
    }

    // Create player stats
    await prisma.playerStats.create({
      data: { userId: user.id, points: 0 }
    })

    // Generate JWT
    const token = await new SignJWT({ userId: user.id, email: user.email, role: user.role })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(JWT_SECRET)

    const response = NextResponse.json({ success: true, user: { id: user.id, email: user.email, role: user.role } })
    response.cookies.set('auth-token', token, { httpOnly: true, maxAge: 60 * 60 * 24 * 7, path: '/' })
    return response
  } catch (error: any) {
    console.error('Join error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create account' }, { status: 500 })
  }
}
