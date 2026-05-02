import { NextRequest, NextResponse } from "next/server"
import { getAuthFromHeaders } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const auth = getAuthFromHeaders(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { postId } = await params

  const existing = await prisma.postLike.findUnique({
    where: { postId_userId: { postId, userId: auth.id } },
  })

  if (existing) {
    await prisma.postLike.delete({ where: { id: existing.id } })
    return NextResponse.json({ liked: false })
  }

  const like = await prisma.postLike.create({
    data: { postId, userId: auth.id },
  })

  const post = await prisma.clubPost.findUnique({ where: { id: postId } })
  if (post && post.authorId !== auth.id) {
    await (await import("@/lib/utils")).notifyUser(post.authorId, "POST_LIKE", "Someone liked your post", "")
  }

  return NextResponse.json({ liked: true })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params
  const count = await prisma.postLike.count({ where: { postId } })
  return NextResponse.json({ count })
}
