'use client'

import { useState, useTransition } from 'react'
import { createAgendaEvent, toggleEventComplete, deleteAgendaEvent, updateAgendaEvent } from '@/app/actions/agenda'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Pencil, Trash2, CalendarDays, CheckCircle2, Circle, MapPin } from 'lucide-react'
import type { AgendaEvent, Category } from '@/lib/db/schema'

interface AgendaClientProps {
  initialEvents: AgendaEvent[]
  categories: Category[]
}

function EventForm({ event, categories, onClose }: { event?: AgendaEvent; categories: Category[]; onClose: () => void }) {
  const [title, setTitle] = useState(event?.title ?? '')
  const [description, setDescription] = useState(event?.description ?? '')
  const [eventDate, setEventDate] = useState(
    event?.eventDate ? new Date(event.eventDate).toISOString().slice(0, 16) : ''
  )
  const [endDate, setEndDate] = useState(
    event?.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : ''
  )
  const [location, setLocation] = useState(event?.location ?? '')
  const [categoryId, setCategoryId] = useState(event?.categoryId?.toString() ?? '')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const data = {
        title,
        description: description || undefined,
        eventDate,
        endDate: endDate || undefined,
        location: location || undefined,
        categoryId: categoryId && categoryId !== 'none' ? parseInt(categoryId) : null,
      }
      if (event) {
        await updateAgendaEvent(event.id, data)
      } else {
        await createAgendaEvent(data)
      }
      onClose()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>Título</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Título del evento" />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Descripción</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Descripción opcional..." className="resize-none" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label>Fecha y hora inicio</Label>
          <Input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Fecha y hora fin</Label>
          <Input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label>Ubicación</Label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Dirección / lugar" />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Categoría</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger><SelectValue placeholder="Sin categoría" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin categoría</SelectItem>
              {categories.map((c) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={isPending}>{isPending ? 'Guardando...' : event ? 'Actualizar' : 'Crear evento'}</Button>
      </DialogFooter>
    </form>
  )
}

export function AgendaClient({ initialEvents, categories }: AgendaClientProps) {
  const [events, setEvents] = useState(initialEvents)
  const [tab, setTab] = useState<'upcoming' | 'completed' | 'all'>('upcoming')
  const [isOpen, setIsOpen] = useState(false)
  const [editEvent, setEditEvent] = useState<AgendaEvent | undefined>()
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]))

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const filtered = events.filter((e) => {
    const d = new Date(e.eventDate)
    d.setHours(0, 0, 0, 0)
    if (tab === 'upcoming') return !e.isCompleted && d >= today
    if (tab === 'completed') return e.isCompleted
    return true
  })

  const handleToggle = (id: number, current: boolean) => {
    startTransition(async () => {
      await toggleEventComplete(id, !current)
      setEvents((prev) => prev.map((e) => e.id === id ? { ...e, isCompleted: !current } : e))
    })
  }

  const handleDelete = (id: number) => {
    startTransition(async () => {
      await deleteAgendaEvent(id)
      setEvents((prev) => prev.filter((e) => e.id !== id))
      setDeleteId(null)
    })
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agenda</h1>
          <p className="text-sm text-muted-foreground mt-1">{events.length} evento{events.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => { setEditEvent(undefined); setIsOpen(true) }} className="gap-2">
          <Plus className="h-4 w-4" /> Nuevo evento
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mb-6">
        <TabsList>
          <TabsTrigger value="upcoming">Próximos</TabsTrigger>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="completed">Completados</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No hay eventos en esta sección</p>
          <Button variant="outline" className="mt-4" onClick={() => { setEditEvent(undefined); setIsOpen(true) }}>
            Agregar evento
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((ev) => {
            const cat = ev.categoryId ? catMap[ev.categoryId] : null
            const evDate = new Date(ev.eventDate)
            const isToday = evDate.toDateString() === new Date().toDateString()
            return (
              <Card key={ev.id} className={`p-4 flex items-start gap-4 transition-opacity ${ev.isCompleted ? 'opacity-60' : ''}`}>
                <button
                  onClick={() => handleToggle(ev.id, ev.isCompleted)}
                  className="mt-0.5 flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
                  aria-label={ev.isCompleted ? 'Marcar pendiente' : 'Marcar completado'}
                >
                  {ev.isCompleted ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Circle className="h-5 w-5" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`font-semibold text-sm ${ev.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {ev.title}
                    </h3>
                    {isToday && !ev.isCompleted && <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-600 border-0">Hoy</Badge>}
                    {cat && (
                      <Badge variant="secondary" style={{ backgroundColor: cat.color + '22', color: cat.color }} className="text-xs border-0">
                        {cat.name}
                      </Badge>
                    )}
                  </div>
                  {ev.description && <p className="text-xs text-muted-foreground mt-1">{ev.description}</p>}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-xs text-muted-foreground">
                      {evDate.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                      {' '}
                      {evDate.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {ev.location && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {ev.location}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditEvent(ev); setIsOpen(true) }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(ev.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={(v) => { if (!v) { setIsOpen(false); setEditEvent(undefined) } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editEvent ? 'Editar evento' : 'Nuevo evento'}</DialogTitle>
          </DialogHeader>
          <EventForm event={editEvent} categories={categories} onClose={() => { setIsOpen(false); setEditEvent(undefined) }} />
        </DialogContent>
      </Dialog>

      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Eliminar evento</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Esta acción no se puede deshacer.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" disabled={isPending} onClick={() => deleteId && handleDelete(deleteId)}>
              {isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
