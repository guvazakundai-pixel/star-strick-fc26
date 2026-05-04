'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, Minus, Plus } from 'lucide-react'
import { format } from 'date-fns'

interface PointsLog {
  id: string
  date: Date
  pointsChange: number
  reason: string
  reasonText: string | null
  admin: string
}

export function DashboardClient({ pointsLogs }: { pointsLogs: PointsLog[] }) {
  return (
    <Card>
      <CardContent className="p-0">
        {pointsLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No points history yet
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><Calendar className="w-4 h-4 inline mr-1" />Date</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Admin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pointsLogs.map(log => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(log.date), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className={`font-medium ${log.pointsChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <span className="inline-flex items-center gap-1">
                      {log.pointsChange > 0 ? <Plus className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                      {log.pointsChange > 0 ? '+' : ''}{log.pointsChange}
                    </span>
                  </TableCell>
                  <TableCell>
                    {log.reason.replace('_', ' ')}
                    {log.reasonText && <span className="text-muted-foreground"> ({log.reasonText})</span>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">@{log.admin}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
