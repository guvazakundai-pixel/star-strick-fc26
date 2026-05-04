'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useToast } from '@/components/ui/use-toast'
import { Eye, EyeOff, Loader2, Check, ChevronsUpDown } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { cn } from '@/lib/utils'

interface Club {
  id: string
  name: string
  tag?: string
}

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultTab?: 'signin' | 'join'
}

const platforms = [
  { value: 'PLAYSTATION', label: 'PlayStation' },
  { value: 'XBOX', label: 'Xbox' },
  { value: 'PC', label: 'PC' },
  { value: 'CROSSPLAY', label: 'Crossplay' },
]

export function AuthModal({ open, onOpenChange, defaultTab = 'join' }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [clubs, setClubs] = useState<Club[]>([])
  const [clubSearchOpen, setClubSearchOpen] = useState(false)
  const [selectedClub, setSelectedClub] = useState<Club | null>(null)
  const [clubOption, setClubOption] = useState<'existing' | 'new' | 'none'>('none')
  const [newClub, setNewClub] = useState({ name: '', tag: '', logo: null as File | null })
  const { toast } = useToast()

  const [signIn, setSignIn] = useState({ email: '', password: '' })
  const [join, setJoin] = useState({
    displayName: '',
    fcUsername: '',
    email: '',
    password: '',
    platform: '',
    clubId: '',
    terms: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [fieldStatus, setFieldStatus] = useState<Record<string, 'checking' | 'available' | 'taken'>>({})

  useEffect(() => {
    if (open && clubOption === 'existing') {
      fetch('/api/clubs?approved=true')
        .then(r => r.json())
        .then(setClubs)
        .catch(() => {})
    }
  }, [open, clubOption])

  const checkAvailability = async (field: 'fcUsername' | 'email', value: string) => {
    if (!value || value.length < 3) return
    setFieldStatus(prev => ({ ...prev, [field]: 'checking' }))
    try {
      const res = await fetch(`/api/auth/check?field=${field}&value=${encodeURIComponent(value)}`)
      const { available } = await res.json()
      setFieldStatus(prev => ({ ...prev, [field]: available ? 'available' : 'taken' }))
    } catch {
      setFieldStatus(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const validateJoin = () => {
    const errs: Record<string, string> = {}
    if (!join.displayName || join.displayName.length < 3 || join.displayName.length > 30)
      errs.displayName = 'Display name must be 3-30 characters'
    if (!join.fcUsername || join.fcUsername.length < 3 || join.fcUsername.length > 20)
      errs.fcUsername = 'EA FC Username must be 3-20 characters'
    if (!join.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(join.email))
      errs.email = 'Valid email required'
    if (!join.password || join.password.length < 8)
      errs.password = 'Password must be at least 8 characters'
    if (!join.platform)
      errs.platform = 'Platform is required'
    if (!join.terms)
      errs.terms = 'You must agree to the terms'
    if (clubOption === 'new' && (!newClub.name || !newClub.tag || newClub.tag.length < 3 || newClub.tag.length > 5))
      errs.club = 'Club name and tag (3-5 chars) required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateJoin()) return
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('displayName', join.displayName)
      formData.append('fcUsername', join.fcUsername)
      formData.append('email', join.email)
      formData.append('password', join.password)
      formData.append('platform', join.platform)
      formData.append('clubOption', clubOption)
      if (clubOption === 'existing' && selectedClub) formData.append('clubId', selectedClub.id)
      if (clubOption === 'new') {
        formData.append('clubName', newClub.name)
        formData.append('clubTag', newClub.tag)
        if (newClub.logo) formData.append('clubLogo', newClub.logo)
      }
      const res = await fetch('/api/auth/join', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to join')
      toast({ title: 'Success!', description: 'Welcome to Star Strick FC26. Redirecting...' })
      setTimeout(() => { window.location.href = '/dashboard' }, 1500)
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signIn),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Sign in failed')
      toast({ title: 'Welcome back!', description: 'Redirecting to dashboard...' })
      setTimeout(() => { window.location.href = '/dashboard' }, 1500)
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            {activeTab === 'join' ? 'Join Rankings' : 'Sign In'}
          </DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="join">Join</TabsTrigger>
          </TabsList>
          <TabsContent value="signin" className="space-y-4 mt-4">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input id="signin-email" type="email" required
                  value={signIn.email} onChange={e => setSignIn({ ...signIn, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <div className="relative">
                  <Input id="signin-password" type={showPassword ? 'text' : 'password'} required
                    value={signIn.password} onChange={e => setSignIn({ ...signIn, password: e.target.value })} />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button type="button" variant="link" className="px-0 text-sm" onClick={() => {
                if (signIn.email) fetch('/api/auth/forgot-password', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: signIn.email })
                }).then(() => toast({ title: 'Check your email', description: 'Password reset link sent' }))
                else toast({ title: 'Enter your email first', variant: 'destructive' })
              }}>Forgot Password?</Button>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="join" className="space-y-4 mt-4">
            <form onSubmit={handleJoin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name *</Label>
                <Input id="displayName" required placeholder="Public name (3-30 chars)"
                  minLength={3} maxLength={30}
                  value={join.displayName} onChange={e => setJoin({ ...join, displayName: e.target.value })} />
                {errors.displayName && <p className="text-sm text-destructive">{errors.displayName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="fcUsername">EA FC Username *</Label>
                <div className="relative">
                  <Input id="fcUsername" required placeholder="3-20 chars, unique" minLength={3} maxLength={20}
                    value={join.fcUsername}
                    onChange={e => { setJoin({ ...join, fcUsername: e.target.value }); checkAvailability('fcUsername', e.target.value) }} />
                  {fieldStatus.fcUsername === 'checking' && <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
                  {fieldStatus.fcUsername === 'available' && <Check className="absolute right-2 top-2.5 h-4 w-4 text-green-500" />}
                  {fieldStatus.fcUsername === 'taken' && <span className="absolute right-2 top-2.5 text-xs text-destructive">Taken</span>}
                </div>
                {errors.fcUsername && <p className="text-sm text-destructive">{errors.fcUsername}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="join-email">Email *</Label>
                <div className="relative">
                  <Input id="join-email" type="email" required placeholder="Used for login + notifications"
                    value={join.email}
                    onChange={e => { setJoin({ ...join, email: e.target.value }); checkAvailability('email', e.target.value) }} />
                  {fieldStatus.email === 'checking' && <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
                  {fieldStatus.email === 'available' && <Check className="absolute right-2 top-2.5 h-4 w-4 text-green-500" />}
                  {fieldStatus.email === 'taken' && <span className="absolute right-2 top-2.5 text-xs text-destructive">Taken</span>}
                </div>
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="join-password">Password *</Label>
                <div className="relative">
                  <Input id="join-password" type={showPassword ? 'text' : 'password'} required placeholder="Min 8 characters"
                    minLength={8} value={join.password} onChange={e => setJoin({ ...join, password: e.target.value })} />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>
              <div className="space-y-2">
                <Label>Club Selection *</Label>
                <RadioGroup value={clubOption} onValueChange={(v) => setClubOption(v as any)} className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="existing" id="club-existing" />
                    <Label htmlFor="club-existing" className="font-normal">Join Existing Club</Label>
                  </div>
                  {clubOption === 'existing' && (
                    <Popover open={clubSearchOpen} onOpenChange={setClubSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between">
                          {selectedClub ? `${selectedClub.name} (${selectedClub.tag})` : "Search approved clubs..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search clubs..." />
                          <CommandEmpty>No clubs found.</CommandEmpty>
                          <CommandList>
                            <CommandGroup>
                              {clubs.map(club => (
                                <CommandItem key={club.id} value={club.name}
                                  onSelect={() => { setSelectedClub(club); setClubSearchOpen(false) }}>
                                  {club.name} {club.tag && `(${club.tag})`}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="new" id="club-new" />
                    <Label htmlFor="club-new" className="font-normal">Create New Club</Label>
                  </div>
                  {clubOption === 'new' && (
                    <div className="space-y-2 pl-6">
                      <Input placeholder="Club Name" value={newClub.name}
                        onChange={e => setNewClub({ ...newClub, name: e.target.value })} />
                      <Input placeholder="Club Tag (3-5 chars)" maxLength={5} value={newClub.tag}
                        onChange={e => setNewClub({ ...newClub, tag: e.target.value })} />
                      <Input type="file" accept="image/*" onChange={e => setNewClub({ ...newClub, logo: e.target.files?.[0] || null })} />
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="club-none" />
                    <Label htmlFor="club-none" className="font-normal">No Club / Free Agent</Label>
                  </div>
                </RadioGroup>
                {errors.club && <p className="text-sm text-destructive">{errors.club}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="platform">Platform *</Label>
                <Select value={join.platform} onValueChange={(v) => setJoin({ ...join, platform: v })}>
                  <SelectTrigger id="platform">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.platform && <p className="text-sm text-destructive">{errors.platform}</p>}
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox id="terms" checked={join.terms} onCheckedChange={(v) => setJoin({ ...join, terms: !!v })} />
                <Label htmlFor="terms" className="text-sm font-normal leading-tight">
                  I agree to Terms & Conditions and consent to my FC Username + Club being public on leaderboards
                </Label>
              </div>
              {errors.terms && <p className="text-sm text-destructive">{errors.terms}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Join Rankings
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
