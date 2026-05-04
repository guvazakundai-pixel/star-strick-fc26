import { notFound } from 'next/navigation'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AdminClient } from '@/components/admin-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldCheck } from 'lucide-react'

export default async function AdminPage() {
  const session = await getServerSession()
  if (!session || !['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(session.role)) {
    notFound()
  }

  const [users, clubs, recentLogs] = await Promise.all([
    prisma.user.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      select: { id: true, fcUsername: true, displayName: true, email: true, role: true, isBanned: true, club: { select: { tag: true } } }
    }),
    prisma.club.findMany({ select: { id: true, name: true, tag: true } }),
    prisma.pointsLog.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { fcUsername: true } }, admin: { select: { fcUsername: true } } }
    })
  ])

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-8 h-8 text-red-500" />
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">Manage users, points, and clubs</p>
        </div>
      </div>

      <AdminClient initialUsers={users} clubs={clubs} initialLogs={recentLogs} />
    </div>
  )
}
