import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getUsers } from '@/app/actions/users'
import { UsersClient } from '@/components/users-client'

export default async function UsuariosPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    redirect('/sign-in')
  }

  if (session.user.email.toLowerCase() !== 'alfonso@latenciacero.cl') {
    redirect('/dashboard')
  }

  const usersList = await getUsers()
  return <UsersClient initialUsers={usersList} currentUserId={session.user.id} />
}
