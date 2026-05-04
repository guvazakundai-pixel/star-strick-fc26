'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Loader2, Upload, Search, Ban, CheckCircle } from 'lucide-react'
import { addPointsAction, uploadCSVAction, toggleBanUser, verifyClub } from '@/app/actions/admin'
import { toast } from '@/components/ui/use-toast'
import { Textarea } from '@/components/ui/textarea'

interface User { id: string; fcUsername: string | null; displayName: string | null; email: string; role: string; isBanned: boolean; club?: { tag: string | null } }
interface Club { id: string; name: string; tag: string | null }
interface PointsLog { id: string; pointsChange: number; reason: string; reasonText: string | null; createdAt: Date; user: { fcUsername: string | null }; admin: { fcUsername: string | null } | null }

interface AdminClientProps {
  initialUsers: User[]
  clubs: Club[]
  initialLogs: PointsLog[]
}

const pointsReasons = [
  { value: 'MATCH_WIN', label: 'Match Win' },
  { value: 'MATCH_LOSS', label: 'Match Loss' },
  { value: 'TOURNAMENT', label: 'Tournament' },
  { value: 'ADMIN_AWARD', label: 'Admin Award' },
  { value: 'ADMIN_DEDUCT', label: 'Admin Deduct' },
  { value: 'BONUS', label: 'Bonus' },
  { value: 'PENALTY', label: 'Penalty' },
]

export function AdminClient({ initialUsers, clubs, initialLogs }: AdminClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [users, setUsers] = useState(initialUsers)
  const [logs, setLogs] = useState(initialLogs)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState('')
  const [pointsValue, setPointsValue] = useState('')
  const [pointsReason, setPointsReason] = useState('')
  const [pointsNote, setPointsNote] = useState('')
  const [csvFile, setCsvFile] = useState<File | null>(null)

  const filteredUsers = users.filter(u =>
    u.fcUsername?.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const handleAddPoints = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser || !pointsValue || !pointsReason) return
    startTransition(async () => {
      const fd = new FormData()
      fd.append('userId', selectedUser)
      fd.append('points', pointsValue)
      fd.append('reason', pointsReason)
      fd.append('note', pointsNote)
      const result = await addPointsAction(fd)
      if (result.error) toast({ title: 'Error', description: result.error, variant: 'destructive' })
      else {
        toast({ title: 'Success', description: `Points ${Number(pointsValue) > 0 ? 'added' : 'deducted'}` })
        setPointsValue(''); setPointsNote(''); setSelectedUser('')
      }
    })
  }

  const handleCSVUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!csvFile) return
    startTransition(async () => {
      const fd = new FormData()
      fd.append('file', csvFile)
      const result = await uploadCSVAction(fd)
      if (result.error) toast({ title: 'Error', description: result.error, variant: 'destructive' })
      else toast({ title: 'Success', description: `Processed ${result.count} entries` })
    })
  }

  const handleToggleBan = (userId: string, currentBan: boolean) => {
    startTransition(async () => {
      const result = await toggleBanUser(userId, !currentBan)
      if (result.error) toast({ title: 'Error', description: result.error, variant: 'destructive' })
      else {
        setUsers(users.map(u => u.id === userId ? { ...u, isBanned: !currentBan } : u))
        toast({ title: 'Success', description: `User ${!currentBan ? 'banned' : 'unbanned'}` })
      }
    })
  }

  return (
    <Tabs defaultValue="points" className="space-y-4">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="points">Add Points</TabsTrigger>
        <TabsTrigger value="users">Manage Users</TabsTrigger>
        <TabsTrigger value="audit">Audit Log</TabsTrigger>
      </TabsList>

      <TabsContent value="points" className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Add/Remove Points</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleAddPoints} className="space-y-4">
              <div className="space-y-2">
                <Label>Search User (FC Username)</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-8" placeholder="Search by FC Username..."
                    value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                {search && (
                  <div className="border rounded-md max-h-32 overflow-y-auto">
                    {filteredUsers.slice(0, 10).map(u => (
                      <div key={u.id} className={`p-2 cursor-pointer hover:bg-muted ${selectedUser === u.id ? 'bg-muted' : ''}`}
                        onClick={() => { setSelectedUser(u.id); setSearch(u.fcUsername || '') }}>
                        {u.fcUsername} ({u.club?.tag}) - {u.email}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Points (+/-)</Label>
                  <Input type="number" placeholder="e.g. 100 or -50" value={pointsValue}
                    onChange={e => setPointsValue(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Select value={pointsReason} onValueChange={setPointsReason}>
                    <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
                    <SelectContent>
                      {pointsReasons.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Note (Optional)</Label>
                <Textarea placeholder="Reason details..." value={pointsNote} onChange={e => setPointsNote(e.target.value)} />
              </div>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Points
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Bulk CSV Upload</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCSVUpload} className="space-y-4">
              <p className="text-sm text-muted-foreground">CSV format: fc_username,points,reason</p>
              <Input type="file" accept=".csv" onChange={e => setCsvFile(e.target.files?.[0] || null)} />
              <Button type="submit" disabled={isPending}>
                {isPending && <Upload className="mr-2 h-4 w-4 animate-spin" />}
                Upload CSV
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="users">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>FC Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(u => (
                  <TableRow key={u.id}>
                    <TableCell>{u.fcUsername}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell><Badge>{u.role}</Badge></TableCell>
                    <TableCell>
                      {u.isBanned ? <Badge variant="destructive">Banned</Badge> : <Badge variant="outline">Active</Badge>}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant={u.isBanned ? "default" : "destructive"}
                        onClick={() => handleToggleBan(u.id, u.isBanned)}>
                        {u.isBanned ? <CheckCircle className="w-4 h-4 mr-1" /> : <Ban className="w-4 h-4 mr-1" />}
                        {u.isBanned ? 'Unban' : 'Ban'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="audit">
        <Card>
          <CardHeader><CardTitle>Audit Log - Recent Points Changes</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Points Change</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell>{new Date(log.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>@{log.user.fcUsername}</TableCell>
                    <TableCell className={log.pointsChange > 0 ? 'text-green-600' : 'text-red-600'}>
                      {log.pointsChange > 0 ? '+' : ''}{log.pointsChange}
                    </TableCell>
                    <TableCell>{log.reason} {log.reasonText && `(${log.reasonText})`}</TableCell>
                    <TableCell>@{log.admin?.fcUsername || 'System'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
