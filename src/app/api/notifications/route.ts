import { NextResponse } from "next/server"
import { getAuthFromHeaders } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { notifyUser } from "@/lib/utils"

export async function GET(request: Request) {
  const auth = getAuthFromHeaders(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const unread = searchParams.get("unread") === "true"

  const notifications = await prisma.notification.findMany({
    where: { userId: auth.id, ...(unread ? { isRead: false } : {}) },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  const unreadCount = await prisma.notification.count({
    where: { userId: auth.id, isRead: false },
  })

  return NextResponse.json({ notifications, unreadCount })
}

export async function PATCH(request: Request) {
  const auth = getAuthFromHeaders(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const { ids } = body as { ids?: string[] }

  if (ids) {
    await prisma.notification.updateMany({
      where: { id: { in: ids }, userId: auth.id },
      data: { isRead: true },
    })
  } else {
    await prisma.notification.updateMany({
      where: { userId: auth.id },
      data: { isRead: true },
    })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const auth = getAuthFromHeaders(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (id) {
    await prisma.notification.deleteMany({ where: { id, userId: auth.id } })
  } else {
    await prisma.notification.deleteMany({ where: { userId: auth.id, isRead: true } })
  }

  return NextResponse.json({ success: true })
}
