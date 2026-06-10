import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getNotes } from '@/app/actions/notes'
import { getAgendaEvents } from '@/app/actions/agenda'
import { getSoftwareLicenses } from '@/app/actions/software'
import { getEquipment } from '@/app/actions/equipment'
import { DashboardHome } from '@/components/dashboard-home'

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const [notes, events, licenses, equipmentList] = await Promise.all([
    getNotes(),
    getAgendaEvents(),
    getSoftwareLicenses(),
    getEquipment(),
  ])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const upcomingEvents = events.filter((e) => {
    const d = new Date(e.eventDate)
    d.setHours(0, 0, 0, 0)
    return d >= today && !e.isCompleted
  }).slice(0, 5)

  const expiringLicenses = licenses.filter((l) => {
    if (!l.expiryDate) return false
    const exp = new Date(l.expiryDate)
    const diff = (exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    return diff >= 0 && diff <= 60
  })

  return (
    <DashboardHome
      userName={session!.user.name}
      totalNotes={notes.length}
      totalEvents={events.length}
      totalLicenses={licenses.length}
      totalEquipment={equipmentList.length}
      upcomingEvents={upcomingEvents}
      expiringLicenses={expiringLicenses}
      recentNotes={notes.slice(0, 4)}
    />
  )
}
