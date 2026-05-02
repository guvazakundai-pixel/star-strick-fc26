import { NextRequest, NextResponse } from "next/server"
import { getAuthFromHeaders } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { uploadToCloudinary } from "@/lib/cloudinary"

const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

export async function POST(request: NextRequest) {
  const auth = getAuthFromHeaders(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get("file") as File | null
  const type = formData.get("type") as string
  const clubId = formData.get("clubId") as string
  const caption = (formData.get("caption") as string) || ""

  if (!file || !type || !clubId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type. Use JPEG, PNG, WebP, or GIF" }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large. Max 5MB" }, { status: 400 })
  }

  const validTypes = ["LOGO", "BANNER", "POST", "GALLERY"]
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: "Invalid media type" }, { status: 400 })
  }

  const club = await prisma.club.findUnique({ where: { id: clubId } })
  if (!club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 })
  }

  if (club.managerId !== auth.id && auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const base64 = `data:${file.type};base64,${buffer.toString("base64")}`

  const folder = club.slug ?? club.name.toLowerCase().replace(/\s+/g, "-")

  try {
    const { url, publicId } = await uploadToCloudinary(base64, folder)

    const media = await prisma.media.create({
      data: {
        clubId,
        uploadedById: auth.id,
        type: type as "LOGO" | "BANNER" | "POST" | "GALLERY",
        url,
        caption: caption || undefined,
      },
    })

    return NextResponse.json({ media, publicId }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Upload failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = getAuthFromHeaders(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const mediaId = searchParams.get("id")

  if (!mediaId) {
    return NextResponse.json({ error: "Missing media ID" }, { status: 400 })
  }

  const media = await prisma.media.findUnique({ where: { id: mediaId } })
  if (!media) {
    return NextResponse.json({ error: "Media not found" }, { status: 404 })
  }

  if (media.uploadedById !== auth.id && auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { deleteFromCloudinary } = await import("@/lib/cloudinary")
    const publicId = media.url.split("/").pop()?.split(".")[0]
    if (publicId) {
      await deleteFromCloudinary(publicId)
    }
  } catch {}

  await prisma.media.delete({ where: { id: mediaId } })
  return NextResponse.json({ success: true })
}
