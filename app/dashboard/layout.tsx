import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { ensureDefaultCategories } from '@/app/actions/categories'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  await ensureDefaultCategories()

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar userName={session.user.name} userEmail={session.user.email} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
