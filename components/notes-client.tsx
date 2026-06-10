'use client'

import { useState, useTransition } from 'react'
import { createNote, updateNote, deleteNote } from '@/app/actions/notes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search, Pencil, Trash2, StickyNote } from 'lucide-react'
import type { Note, Category } from '@/lib/db/schema'

const PRIORITIES = [
  { value: 'alta', label: 'Alta', color: 'bg-red-500' },
  { value: 'normal', label: 'Normal', color: 'bg-blue-500' },
  { value: 'baja', label: 'Baja', color: 'bg-slate-400' },
]

interface NotesClientProps {
  initialNotes: Note[]
  categories: Category[]
}

function NoteForm({
  note,
  categories,
  onClose,
}: {
  note?: Note
  categories: Category[]
  onClose: () => void
}) {
  const [title, setTitle] = useState(note?.title ?? '')
  const [content, setContent] = useState(note?.content ?? '')
  const [priority, setPriority] = useState(note?.priority ?? 'normal')
  const [categoryId, setCategoryId] = useState(note?.categoryId?.toString() ?? '')
  const [tags, setTags] = useState(note?.tags ?? '')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const data = {
        title,
        content,
        priority,
        categoryId: categoryId && categoryId !== 'none' ? parseInt(categoryId) : null,
        tags: tags || undefined,
      }
      if (note) {
        await updateNote(note.id, data)
      } else {
        await createNote(data)
      }
      onClose()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Título</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Título de la nota" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="content">Contenido</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          placeholder="Escribe el contenido de tu nota..."
          className="resize-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label>Prioridad</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Categoría</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="Sin categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin categoría</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="tags">Etiquetas (separadas por coma)</Label>
        <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="windows, office, cliente..." />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={isPending}>{isPending ? 'Guardando...' : note ? 'Actualizar' : 'Crear nota'}</Button>
      </DialogFooter>
    </form>
  )
}

export function NotesClient({ initialNotes, categories }: NotesClientProps) {
  const [notes, setNotes] = useState(initialNotes)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [isOpen, setIsOpen] = useState(false)
  const [editNote, setEditNote] = useState<Note | undefined>()
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  // Optimistic refresh via revalidate — re-fetch via router trick
  // We use server action which revalidates path, so we just close dialog.

  const filtered = notes.filter((n) => {
    const matchSearch = n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCat === 'all' || (filterCat === 'none' ? !n.categoryId : n.categoryId?.toString() === filterCat)
    const matchPriority = filterPriority === 'all' || n.priority === filterPriority
    return matchSearch && matchCat && matchPriority
  })

  const handleDelete = (id: number) => {
    startTransition(async () => {
      await deleteNote(id)
      setNotes((prev) => prev.filter((n) => n.id !== id))
      setDeleteId(null)
    })
  }

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]))

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notas</h1>
          <p className="text-sm text-muted-foreground mt-1">{notes.length} nota{notes.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => { setEditNote(undefined); setIsOpen(true) }} className="gap-2">
          <Plus className="h-4 w-4" /> Nueva nota
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar notas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-40">
            <SelectValue>{filterCat === 'all' ? 'Todas las categorías' : filterCat === 'none' ? 'Sin categoría' : (categories.find(c => c.id.toString() === filterCat)?.name ?? 'Categoría')}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            <SelectItem value="none">Sin categoría</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-36">
            <SelectValue>{filterPriority === 'all' ? 'Todas' : (PRIORITIES.find(p => p.value === filterPriority)?.label ?? 'Prioridad')}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {PRIORITIES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Notes Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <StickyNote className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No hay notas que mostrar</p>
          <Button variant="outline" className="mt-4" onClick={() => { setEditNote(undefined); setIsOpen(true) }}>
            Crear primera nota
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((note) => {
            const prio = PRIORITIES.find((p) => p.value === note.priority)
            const cat = note.categoryId ? catMap[note.categoryId] : null
            return (
              <Card key={note.id} className="p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${prio?.color ?? 'bg-slate-400'}`} />
                    <h3 className="font-semibold text-foreground text-sm truncate">{note.title}</h3>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditNote(note); setIsOpen(true) }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(note.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-4 flex-1">{note.content || 'Sin contenido'}</p>
                <div className="flex flex-wrap gap-1.5 items-center">
                  {cat && (
                    <Badge variant="secondary" style={{ backgroundColor: cat.color + '22', color: cat.color }} className="text-xs border-0">
                      {cat.name}
                    </Badge>
                  )}
                  {note.tags && note.tags.split(',').slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">{tag.trim()}</Badge>
                  ))}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date(note.updatedAt).toLocaleDateString('es-CL')}
                  </span>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={(v) => { if (!v) { setIsOpen(false); setEditNote(undefined) } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editNote ? 'Editar nota' : 'Nueva nota'}</DialogTitle>
          </DialogHeader>
          <NoteForm
            note={editNote}
            categories={categories}
            onClose={() => { setIsOpen(false); setEditNote(undefined) }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar nota</DialogTitle>
          </DialogHeader>
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
