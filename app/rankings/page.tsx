import { Suspense } from 'react'
import { getPlayers, getClubs } from '@/app/actions/rankings'
import { RankingsClient } from '@/components/rankings-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy } from 'lucide-react'

export const metadata = { title: 'Rankings - Star Strick FC26' }

export default async function RankingsPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string; platform?: string; type?: string }
}) {
  const page = parseInt(searchParams.page || '1')
  const search = searchParams.search || ''
  const platform = searchParams.platform || ''
  const type = searchParams.type || 'players'

  const [playersData, clubs] = await Promise.all([
    type === 'players' ? getPlayers({ page, search, platform }) : { data: [], total: 0, totalPages: 0 },
    getClubs(),
  ])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            Leaderboards
          </h1>
          <p className="text-muted-foreground mt-1">Global rankings and club standings</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="py-8 text-center">Loading rankings...</div>}>
            <RankingsClient
              initialData={playersData}
              clubs={clubs}
              initialType={type}
              initialSearch={search}
              initialPlatform={platform}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
