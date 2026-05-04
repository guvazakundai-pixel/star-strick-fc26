import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, Trophy, Calendar, Settings } from 'lucide-react'
import Link from 'next/link'

export default async function ClubPage({ params }: { params: { tag: string } }) {
  const club = await prisma.club.findUnique({
    where: { tag: params.tag },
    include: {
      manager: { select: { id: true, displayName: true, fcUsername: true } },
      members: {
        include: { user: { include: { playerStats: true } } },
        orderBy: { joinedAt: 'asc' }
      },
      globalRank: true,
    }
  })

  if (!club) notFound()

  const totalPoints = club.members.reduce((sum, m) => sum + (m.user.playerStats?.points || 0), 0)
  const avgPoints = club.members.length > 0 ? Math.round(totalPoints / club.members.length) : 0

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Club Header */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center text-2xl font-bold">
          {club.tag || club.name.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">{club.name}</h1>
            {club.isVerified && <Badge variant="secondary">Verified</Badge>}
            {club.status === 'PENDING' && <Badge variant="outline">Pending</Badge>}
          </div>
          {club.tag && <p className="text-muted-foreground">[{club.tag}]</p>}
          <p className="text-sm text-muted-foreground mt-1">{club.city}, {club.country}</p>
          <div className="flex gap-4 mt-3">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span className="text-sm">{club.members.length} members</span>
            </div>
            <div className="flex items-center gap-1">
              <Trophy className="w-4 h-4" />
              <span className="text-sm">{totalPoints.toLocaleString()} pts</span>
            </div>
            {club.globalRank && (
              <div className="flex items-center gap-1">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="text-sm">Rank #{club.globalRank.rankPosition}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/club/${club.tag}/manage`}>Manage</Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Points</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{totalPoints.toLocaleString()}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Avg Points/Member</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{avgPoints}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Members</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{club.members.length}</p></CardContent>
        </Card>
      </div>

      {/* Roster */}
      <Card>
        <CardHeader><CardTitle>Club Roster</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {club.members.map(m => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium">{m.user.displayName || m.user.fcUsername}</p>
                  <p className="text-sm text-muted-foreground">@{m.user.fcUsername}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{m.user.playerStats?.points || 0} pts</p>
                  <p className="text-xs text-muted-foreground">
                    {m.user.platform?.replace('_', ' ')}
                  </p>
                </div>
              </div>
            ))}
            {club.members.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No members yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
