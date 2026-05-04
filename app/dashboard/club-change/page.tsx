import { notFound, redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ClubChangeClient } from '@/components/club-change-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function ClubChangePage() {
  const session = await getServerSession()
  if (!session) redirect('/')

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { club: { select: { id: true, name: true, tag: true } } }
  })

  if (!user) notFound()

  const clubs = await prisma.club.findMany({
    where: { isBanned: false },
    select: { id: true, name: true, tag: true }
  })

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/dashboard"><ArrowLeft className="w-4 h-4 mr-2" />Back to Dashboard</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Request Club Change</CardTitle>
        </CardHeader>
        <CardContent>
          <ClubChangeClient currentClub={user.club} clubs={clubs} />
        </CardContent>
      </Card>
    </div>
  )
}
