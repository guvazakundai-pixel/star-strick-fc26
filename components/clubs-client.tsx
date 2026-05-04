'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Users, Trophy } from 'lucide-react'
import Link from 'next/link'

interface Club {
  id: string
  name: string
  tag: string | null
  logoUrl: string | null
  _count?: { members: number }
}

interface ClubsClientProps {
  clubs: Club[]
}

export function ClubsClient({ clubs }: ClubsClientProps) {
  const [search, setSearch] = useState('')

  const filtered = clubs.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.tag?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search clubs..."
          className="pl-8"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No clubs found
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(club => (
          <Card key={club.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <Link href={`/club/${club.tag || club.id}`} className="block">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center font-bold">
                    {club.tag || club.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold">{club.name}</h3>
                    {club.tag && <p className="text-sm text-muted-foreground">[{club.tag}]</p>}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {club._count?.members || 0} members
                  </span>
                </div>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
