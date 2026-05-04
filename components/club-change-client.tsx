'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, AlertTriangle } from 'lucide-react'
import { requestClubChangeAction } from '@/app/actions/profile'
import { useToast } from '@/components/ui/use-toast'
import { Input } from '@/components/ui/input'

interface Club { id: string; name: string; tag: string | null }

interface ClubChangeClientProps {
  currentClub: { id: string; name: string; tag: string | null } | null
  clubs: Club[]
}

export function ClubChangeClient({ currentClub, clubs }: ClubChangeClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, setIsPending] = useState(false)
  const [option, setOption] = useState<'leave' | 'join' | 'new'>('join')
  const [selectedClub, setSelectedClub] = useState('')
  const [newClubName, setNewClubName] = useState('')
  const [newClubTag, setNewClubTag] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPending(true)
    try {
      const fd = new FormData()
      fd.append('action', option)
      if (option === 'join') fd.append('clubId', selectedClub)
      if (option === 'new') {
        fd.append('clubName', newClubName)
        fd.append('clubTag', newClubTag)
      }
      const result = await requestClubChangeAction(fd)
      if (result.error) throw new Error(result.error)
      toast({ title: 'Success', description: 'Club change requested' })
      router.push('/dashboard')
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {currentClub && (
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">Current Club</p>
          <p className="font-semibold">{currentClub.name} [{currentClub.tag}]</p>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> 7-day cooldown applies before joining new club
          </p>
        </div>
      )}

      <RadioGroup value={option} onValueChange={v => setOption(v as any)}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="join" id="join" />
          <Label htmlFor="join">Join Existing Club</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="new" id="new" />
          <Label htmlFor="new">Create New Club</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="leave" id="leave" />
          <Label htmlFor="leave">Leave Club (Become Free Agent)</Label>
        </div>
      </RadioGroup>

      {option === 'join' && (
        <div className="space-y-2">
          <Label>Select Club</Label>
          <Select value={selectedClub} onValueChange={setSelectedClub}>
            <SelectTrigger><SelectValue placeholder="Choose a club" /></SelectTrigger>
            <SelectContent>
              {clubs.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name} {c.tag && `[${c.tag}]`}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {option === 'new' && (
        <div className="space-y-4 pl-6">
          <div className="space-y-2">
            <Label>Club Name</Label>
            <Input value={newClubName} onChange={e => setNewClubName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Club Tag (3-5 chars)</Label>
            <Input value={newClubTag} maxLength={5} onChange={e => setNewClubTag(e.target.value)} />
          </div>
        </div>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Submit Request
      </Button>
    </form>
  )
}
