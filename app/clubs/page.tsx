import { getClubs } from '@/app/actions/clubs'
import { ClubsClient } from '@/components/clubs-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users } from 'lucide-react'

export const metadata = { title: 'Clubs - Star Strick FC26' }

export default async function ClubsPage() {
  const clubs = await getClubs()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="w-8 h-8" /> Clubs
          </h1>
          <p className="text-muted-foreground mt-1">Browse and join clubs</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>All Clubs</CardTitle></CardHeader>
        <CardContent>
          <ClubsClient clubs={clubs} />
        </CardContent>
      </Card>
    </div>
  )
}
