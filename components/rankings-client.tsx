'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Trophy, Search, ChevronLeft, ChevronRight, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Player {
  rank: number
  id: string
  fcUsername: string | null
  displayName: string | null
  platform: string | null
  points: number
  club: { id: string; name: string; tag: string | null } | null
}

interface Club {
  id: string
  name: string
  tag: string | null
}

interface RankingsClientProps {
  initialData: { data: Player[]; total: number; totalPages: number; page: number }
  clubs: Club[]
  initialType?: string
  initialSearch?: string
  initialPlatform?: string
}

const platforms = [
  { value: 'PLAYSTATION', label: 'PlayStation' },
  { value: 'XBOX', label: 'Xbox' },
  { value: 'PC', label: 'PC' },
  { value: 'CROSSPLAY', label: 'Crossplay' },
]

export function RankingsClient({
  initialData,
  clubs,
  initialType = 'players',
  initialSearch = '',
  initialPlatform = '',
}: RankingsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [type, setType] = useState(initialType)
  const [search, setSearch] = useState(initialSearch)
  const [platform, setPlatform] = useState(initialPlatform)
  const [data, setData] = useState(initialData)

  const updateFilters = (newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) params.set(key, value)
      else params.delete(key)
    })
    startTransition(() => {
      router.push(`/rankings?${params.toString()}`)
    })
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search FC Username..."
            className="pl-8"
            value={search}
            onChange={e => { setSearch(e.target.value); updateFilters({ search: e.target.value, page: '1' }) }}
          />
        </div>
        <Select value={platform} onValueChange={v => { setPlatform(v); updateFilters({ platform: v, page: '1' }) }}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Platforms</SelectItem>
            {platforms.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={type} onValueChange={v => { setType(v); updateFilters({ type: v, page: '1' }) }}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="players"><Trophy className="w-4 h-4 mr-2" />Players</TabsTrigger>
          <TabsTrigger value="clubs"><Users className="w-4 h-4 mr-2" />Clubs</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Empty State */}
      {data.data.length === 0 && (
        <div className="text-center py-12 space-y-4">
          <Trophy className="w-16 h-16 mx-auto text-muted-foreground" />
          <h3 className="text-lg font-semibold">No players yet</h3>
          <p className="text-muted-foreground">Be the first to join the rankings!</p>
          <Button asChild>
            <a href="#" onClick={(e) => { e.preventDefault(); document.dispatchEvent(new CustomEvent('open-auth-modal', { detail: 'join' })) }}>
              Join Rankings
            </a>
          </Button>
        </div>
      )}

      {/* Rankings Table */}
      {data.data.length > 0 && (
        <div className="space-y-2">
          {data.data.map((player) => (
            <Card key={player.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                      player.rank === 1 && "bg-yellow-500 text-white",
                      player.rank === 2 && "bg-gray-300 text-black",
                      player.rank === 3 && "bg-amber-600 text-white",
                      player.rank > 3 && "bg-muted"
                    )}>
                      {player.rank}
                    </div>
                    <div>
                      <p className="font-medium">{player.displayName || player.fcUsername}</p>
                      <p className="text-sm text-muted-foreground">@{player.fcUsername}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{player.points.toLocaleString()} pts</p>
                    <p className="text-xs text-muted-foreground">
                      {player.club?.tag && `[${player.club.tag}] `}{player.platform?.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between pt-4">
        <Button
          variant="outline"
          disabled={data.page <= 1 || isPending}
          onClick={() => updateFilters({ page: (data.page -1).toString() })}
        >
          <ChevronLeft className="w-4 h-4 mr-2" /> Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {data.page} of {data.totalPages}
        </span>
        <Button
          variant="outline"
          disabled={data.page >= data.totalPages || isPending}
          onClick={() => updateFilters({ page: (data.page +1).toString() })}
        >
          Next <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
