'use client'

import { useState, useTransition } from 'react'
import { createCategory, deleteCategory } from '@/app/actions/categories'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, Trash2, Tag, Shield } from 'lucide-react'
import type { Category } from '@/lib/db/schema'

const PRESET_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1',
  '#84cc16', '#64748b',
]

export function CategoriesClient({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState(initialCategories)
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState('#3b82f6')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      await createCategory({ name, color })
      setName('')
      setColor('#3b82f6')
      setIsOpen(false)
    })
  }

  const handleDelete = (id: number) => {
    startTransition(async () => {
      try {
        await deleteCategory(id)
        setCategories((prev) => prev.filter((c) => c.id !== id))
      } catch {
        // no-op: default categories can't be deleted
      }
      setDeleteId(null)
    })
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Categorías</h1>
          <p className="text-sm text-muted-foreground mt-1">Organiza tus registros con categorías personalizadas</p>
        </div>
        <Button onClick={() => setIsOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Nueva categoría
        </Button>
      </div>

      {/* Default categories */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Predeterminadas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {categories.filter((c) => c.isDefault).map((cat) => (
            <Card key={cat.id} className="p-4 flex items-center gap-3">
              <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
              <span className="font-medium text-sm text-foreground flex-1">{cat.name}</span>
              <Shield className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" title="Categoría predeterminada" />
            </Card>
          ))}
        </div>
      </div>

      {/* Custom categories */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Personalizadas</h2>
        {categories.filter((c) => !c.isDefault).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border rounded-xl">
            <Tag className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Sin categorías personalizadas aún</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setIsOpen(true)}>
              Crear primera categoría
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categories.filter((c) => !c.isDefault).map((cat) => (
              <Card key={cat.id} className="p-4 flex items-center gap-3">
                <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                <span className="font-medium text-sm text-foreground flex-1">{cat.name}</span>
                <Badge variant="secondary" style={{ backgroundColor: cat.color + '22', color: cat.color }} className="text-xs border-0">
                  {cat.name}
                </Badge>
                <Button
                  variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive flex-shrink-0"
                  onClick={() => setDeleteId(cat.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={isOpen} onOpenChange={(v) => { if (!v) { setIsOpen(false); setName(''); setColor('#3b82f6') } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Nueva categoría</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Nombre</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Nombre de la categoría" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-foreground scale-110' : 'hover:scale-105'}`}
                    style={{ backgroundColor: c }}
                    aria-label={c}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <Input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-8 w-20 p-1 cursor-pointer"
                />
                <span className="text-xs text-muted-foreground font-mono">{color}</span>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isPending}>{isPending ? 'Creando...' : 'Crear categoría'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Eliminar categoría</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Los registros asociados quedarán sin categoría. Esta acción no se puede deshacer.</p>
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
