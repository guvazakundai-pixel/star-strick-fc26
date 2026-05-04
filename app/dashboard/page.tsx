import { notFound } from 'next/navigation'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DashboardClient } from '@/components/dashboard-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Users, TrendingUp, Settings } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await getServerSession()
  if (!session) return notFound()

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      playerStats: true,
      club: { select: { id: true, name: true, tag: true } },
      pointsLogs: {
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: { admin: { select: { fcUsername: true } }
      }
    }
  })

  if (!user) return notFound()

  // Calculate rank
  const rank = await prisma.$queryRaw<Array<{ rank: bigint }>>`
    SELECT ROW_NUMBER() OVER (ORDER BY COALESCE(ps.points, 0) DESC) as rank
    FROM users u
    LEFT JOIN player_stats ps ON u.id = ps.user_id
    WHERE u.is_banned = false AND u.is_verified = true
  `.then(async () => {
    const allUsers = await prisma.user.findMany({
      where: { isBanned: false, isVerified: true },
      include: { playerStats: true },
      orderBy: { playerStats: { points: 'desc' } }
    })
    const index = allUsers.findIndex(u => u.id === user.id)
    return index >= 0 ? index + 1 : null
  })

  const stats = user.playerStats || { points: 0, matchesPlayed: 0, wins: 0, losses: 0, draws: 0 }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user.displayName || user.fcUsername}</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button variant="outline" asChild>
            <Link href="/dashboard/edit-profile">Edit Profile</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/club-change">Request Club Change</Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" /> Current Rank
          </CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">#{rank || 'N/A'}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" /> Total Points
          </CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{stats.points.toLocaleString()}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="w-4 h-4" /> Club
          </CardTitle></CardHeader>
          <CardContent>
            {user.club ? (
              <p className="text-lg font-semibold">{user.club.name} [{user.club.tag}]</p>
            ) : (
              <p className="text-muted-foreground">Free Agent</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Platform</CardTitle></CardHeader>
          <CardContent><p className="text-lg font-semibold">{user.platform?.replace('_', ' ')}</p></CardContent>
        </Card>
      </div>

      {/* Points History */}
      <Card>
        <CardHeader><CardTitle>Recent Points History</CardTitle></CardHeader>
        <CardContent>
          <DashboardClient pointsLogs={user.pointsLogs.map(log => ({
            id: log.id,
            date: log.createdAt,
            pointsChange: log.pointsChange,
            reason: log.reason,
            reasonText: log.reasonText,
            admin: log.admin?.fcUsername || 'System'
          }))} />
        </CardContent>
      </Card>

      {/* Stats - Placeholder for future match tracking */}
      <Card>
        <CardHeader><CardTitle>Stats</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{stats.matchesPlayed}</p>
              <p className="text-sm text-muted-foreground">Matches Played</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.wins}</p>
              <p className="text-sm text-muted-foreground">Wins</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{stats.losses}</p>
              <p className="text-sm text-muted-foreground">Losses</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {stats.matchesPlayed > 0 ? Math.round((stats.wins / stats.matchesPlayed) * 100) : 0}%
              </p>
              <p className="text-sm text-muted-foreground">Win Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
