import { notFound, redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EditProfileClient } from '@/components/edit-profile-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function EditProfilePage() {
  const session = await getServerSession()
  if (!session) redirect('/')

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, displayName: true, platform: true, fcUsername: true }
  })

  if (!user) notFound()

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/dashboard"><ArrowLeft className="w-4 h-4 mr-2" />Back to Dashboard</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <EditProfileClient user={user} />
        </CardContent>
      </Card>
    </div>
  )
}
