'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StickyNote, CalendarDays, Laptop, HardDrive, AlertTriangle, Clock, ArrowRight } from 'lucide-react'
import type { AgendaEvent, SoftwareLicense, Note } from '@/lib/db/schema'

interface DashboardHomeProps {
  userName: string
  totalNotes: number
  totalEvents: number
  totalLicenses: number
  totalEquipment: number
  upcomingEvents: AgendaEvent[]
  expiringLicenses: SoftwareLicense[]
  recentNotes: Note[]
}

const priorityColor: Record<string, string> = {
  alta: 'bg-red-500',
  normal: 'bg-blue-500',
  baja: 'bg-slate-400',
}

function daysUntil(dateStr: string | null) {
  if (!dateStr) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(dateStr)
  return Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function DashboardHome({
  userName,
  totalNotes,
  totalEvents,
  totalLicenses,
  totalEquipment,
  upcomingEvents,
  expiringLicenses,
  recentNotes,
}: DashboardHomeProps) {
  const stats = [
    { label: 'Notas', value: totalNotes, icon: StickyNote, href: '/dashboard/notas', color: 'text-blue-500' },
    { label: 'Eventos', value: totalEvents, icon: CalendarDays, href: '/dashboard/agenda', color: 'text-emerald-500' },
    { label: 'Licencias', value: totalLicenses, icon: Laptop, href: '/dashboard/software', color: 'text-amber-500' },
    { label: 'Equipos', value: totalEquipment, icon: HardDrive, href: '/dashboard/equipos', color: 'text-violet-500' },
  ]

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">{greeting}, {userName.split(' ')[0]}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {new Date().toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <Link key={s.href} href={s.href}>
              <Card className="p-4 hover:bg-accent/50 transition-colors cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`h-5 w-5 ${s.color}`} />
                  <span className="text-2xl font-bold text-foreground">{s.value}</span>
                </div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </Card>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming events */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-500" />
              <h2 className="font-semibold text-foreground text-sm">Próximos eventos</h2>
            </div>
            <Link href="/dashboard/agenda" className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors">
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Sin eventos próximos</p>
          ) : (
            <div className="flex flex-col gap-2">
              {upcomingEvents.map((ev) => (
                <div key={ev.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{ev.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(ev.eventDate).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Expiring licenses */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <h2 className="font-semibold text-foreground text-sm">Licencias por vencer (60 días)</h2>
            </div>
            <Link href="/dashboard/software" className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors">
              Ver todas <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {expiringLicenses.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Sin vencimientos próximos</p>
          ) : (
            <div className="flex flex-col gap-2">
              {expiringLicenses.map((lic) => {
                const days = daysUntil(lic.expiryDate)
                return (
                  <div key={lic.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{lic.softwareName}</p>
                      <p className="text-xs text-muted-foreground">{lic.version ?? ''}</p>
                    </div>
                    <Badge variant={days !== null && days <= 14 ? 'destructive' : 'secondary'} className="text-xs ml-2 flex-shrink-0">
                      {days === 0 ? 'Hoy' : `${days}d`}
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Recent notes */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-blue-500" />
              <h2 className="font-semibold text-foreground text-sm">Notas recientes</h2>
            </div>
            <Link href="/dashboard/notas" className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors">
              Ver todas <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {recentNotes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Sin notas aún</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recentNotes.map((note) => (
                <Link key={note.id} href="/dashboard/notas">
                  <div className="border border-border rounded-lg p-3 hover:bg-accent/40 transition-colors cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityColor[note.priority] ?? 'bg-slate-400'}`} />
                      <p className="text-sm font-medium text-foreground truncate">{note.title}</p>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{note.content || 'Sin contenido'}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(note.updatedAt).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
