import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthFromHeaders } from "@/lib/auth"
import { prisma } from "@/lib/db"

const commentSchema = z.object({
  content: z.string().min(1).max(500),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const auth = getAuthFromHeaders(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { postId } = await params
  const body = await request.json()
  const parsed = commentSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const comment = await prisma.postComment.create({
    data: {
      postId,
      userId: auth.id,
      content: parsed.data.content,
    },
    include: {
      user: { select: { id: true, username: true, avatarUrl: true } },
    },
  })

  const post = await prisma.clubPost.findUnique({ where: { id: postId } })
  if (post && post.authorId !== auth.id) {
    await (await import("@/lib/utils")).notifyUser(post.authorId, "POST_COMMENT", "Someone commented on your post", "")
  }

  return NextResponse.json({ comment }, { status: 201 })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params
  const comments = await prisma.postComment.findMany({
    where: { postId },
    include: { user: { select: { id: true, username: true, avatarUrl: true } } },
    orderBy: { createdAt: "asc" },
  })
  return NextResponse.json({ comments })
}
