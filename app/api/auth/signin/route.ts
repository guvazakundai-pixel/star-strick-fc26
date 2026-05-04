import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'

const prisma = new PrismaClient()
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'change-this-to-a-secure-random-string-in-production')

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password)
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || user.isBanned)
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid)
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    })

    const token = await new SignJWT({ userId: user.id, email: user.email, role: user.role })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(JWT_SECRET)

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, role: user.role, fcUsername: user.fcUsername }
    })
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    })
    return response
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Sign in failed' }, { status: 500 })
  }
}
