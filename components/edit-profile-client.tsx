'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { updateProfileAction } from '@/app/actions/profile'
import { platforms } from '@/lib/constants'
import { useToast } from '@/components/ui/use-toast'

interface User { id: string; displayName: string | null; platform: string | null; fcUsername: string | null }

interface EditProfileClientProps { user: User }

export function EditProfileClient({ user }: EditProfileClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, setIsPending] = useState(false)
  const [displayName, setDisplayName] = useState(user.displayName || '')
  const [platform, setPlatform] = useState(user.platform || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPending(true)
    try {
      const fd = new FormData()
      fd.append('displayName', displayName)
      fd.append('platform', platform)
      const result = await updateProfileAction(fd)
      if (result.error) throw new Error(result.error)
      toast({ title: 'Success', description: 'Profile updated' })
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>EA FC Username</Label>
        <Input value={user.fcUsername || ''} disabled />
        <p className="text-xs text-muted-foreground">FC Username cannot be changed without admin assistance</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="displayName">Display Name</Label>
        <Input id="displayName" value={displayName} onChange={e => setDisplayName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Platform</Label>
        <Select value={platform} onValueChange={setPlatform}>
          <SelectTrigger><SelectValue placeholder="Select platform" /></SelectTrigger>
          <SelectContent>
            {platforms.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Changes
      </Button>
    </form>
  )
}
