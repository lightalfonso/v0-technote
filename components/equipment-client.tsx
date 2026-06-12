'use client'

import { useState, useTransition, useEffect } from 'react'
import { createEquipment, updateEquipment, deleteEquipment } from '@/app/actions/equipment'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search, Pencil, Trash2, HardDrive, Copy, Check } from 'lucide-react'
import type { Equipment, Category } from '@/lib/db/schema'

const OWNER_TYPES = [
  { value: 'client', label: 'Cliente' },
  { value: 'work', label: 'Trabajo' },
  { value: 'personal', label: 'Personal' },
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'Activo', color: 'bg-emerald-500/10 text-emerald-600' },
  { value: 'repair', label: 'En reparación', color: 'bg-amber-500/10 text-amber-600' },
  { value: 'retired', label: 'Dado de baja', color: 'bg-red-500/10 text-red-600' },
  { value: 'storage', label: 'En bodega', color: 'bg-blue-500/10 text-blue-600' },
]

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
      navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }} title="Copiar serial">
      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
    </Button>
  )
}

function EquipmentForm({ item, categories, onClose }: { item?: Equipment; categories: Category[]; onClose: () => void }) {
  const [eqType, setEqType] = useState(() => {
    if (!item?.name) return 'Notebook'
    if (['Notebook', 'Desktop', 'Router', 'Switch'].includes(item.name)) return item.name
    return 'Otro'
  })
  const [customType, setCustomType] = useState(() => {
    if (!item?.name) return ''
    if (['Notebook', 'Desktop', 'Router', 'Switch'].includes(item.name)) return ''
    return item.name
  })
  const [brand, setBrand] = useState(item?.brand ?? '')
  const [model, setModel] = useState(item?.model ?? '')
  const [serialNumber, setSerialNumber] = useState(item?.serialNumber ?? '')
  const [ownerName, setOwnerName] = useState(item?.ownerName ?? '')
  const [ownerType, setOwnerType] = useState(item?.ownerType ?? 'client')
  const [purchaseDate, setPurchaseDate] = useState(item?.purchaseDate ?? '')
  const [warrantyExpiry, setWarrantyExpiry] = useState(item?.warrantyExpiry ?? '')
  const [capacity, setCapacity] = useState(item?.capacity ?? '')
  const [specs, setSpecs] = useState(item?.specs ?? '')
  const [notes, setNotes] = useState(item?.notes ?? '')
  const [status, setStatus] = useState(item?.status ?? 'active')
  const [lastMaintenance, setLastMaintenance] = useState(item?.lastMaintenance ?? '')
  const [categoryId, setCategoryId] = useState(item?.categoryId?.toString() ?? '')
  const [pricePaid, setPricePaid] = useState(item?.pricePaid?.toString() ?? '')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const finalName = eqType === 'Otro' ? customType.trim() : eqType
      if (!finalName) return
      const data = {
        name: finalName, 
        brand: brand || undefined, 
        model: model || undefined,
        serialNumber: serialNumber || undefined, 
        ownerName: ownerName || undefined,
        ownerType, 
        purchaseDate: purchaseDate || undefined,
        warrantyExpiry: warrantyExpiry || undefined, 
        capacity: capacity || undefined,
        specs: specs || undefined, 
        notes: notes || undefined, 
        status,
        lastMaintenance: lastMaintenance || undefined,
        categoryId: categoryId && categoryId !== 'none' ? parseInt(categoryId) : null,
        pricePaid: pricePaid ? parseInt(pricePaid) : null,
      }
      if (item) { 
        await updateEquipment(item.id, data) 
      } else { 
        await createEquipment(data) 
      }
      onClose()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2 col-span-2">
          <Label>Tipo de Equipo</Label>
          <Select value={eqType} onValueChange={setEqType}>
            <SelectTrigger>
              <SelectValue>{eqType}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Notebook">Notebook</SelectItem>
              <SelectItem value="Desktop">Desktop</SelectItem>
              <SelectItem value="Router">Router</SelectItem>
              <SelectItem value="Switch">Switch</SelectItem>
              <SelectItem value="Otro">Otro (Nuevo)...</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {eqType === 'Otro' && (
          <div className="flex flex-col gap-2 col-span-2">
            <Label>Escribe el tipo de equipo</Label>
            <Input 
              value={customType} 
              onChange={(e) => setCustomType(e.target.value)} 
              placeholder="Ej: Servidor, Impresora" 
              required={eqType === 'Otro'}
            />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <Label>Marca</Label>
          <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Dell, HP, Samsung..." />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Modelo</Label>
          <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Latitude 5520..." />
        </div>
        <div className="flex flex-col gap-2 col-span-2">
          <Label>Número de serie</Label>
          <Input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} placeholder="SN123456789" className="font-mono" />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Propietario</Label>
          <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Juan Pérez / Empresa..." />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Tipo de propietario</Label>
          <Select value={ownerType} onValueChange={setOwnerType}>
            <SelectTrigger>
              <SelectValue>
                {OWNER_TYPES.find(o => o.value === ownerType)?.label ?? 'Seleccione'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {OWNER_TYPES.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Estado</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue>
                {STATUS_OPTIONS.find(s => s.value === status)?.label ?? 'Seleccione'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Categoría</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger>
              <SelectValue>
                {categoryId === 'none' || !categoryId
                  ? 'Sin categoría'
                  : (categories.find(c => c.id.toString() === categoryId)?.name ?? 'Sin categoría')}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin categoría</SelectItem>
              {categories.map((c) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Fecha de compra</Label>
          <Input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Vencimiento garantía</Label>
          <Input type="date" value={warrantyExpiry} onChange={(e) => setWarrantyExpiry(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Capacidad</Label>
          <Input value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="500GB SSD, 16GB RAM..." />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Última mantención</Label>
          <Input type="date" value={lastMaintenance} onChange={(e) => setLastMaintenance(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2 col-span-2">
          <Label>Monto cobrado/pagado por equipo (CLP)</Label>
          <Input type="number" value={pricePaid} onChange={(e) => setPricePaid(e.target.value)} placeholder="Ej: 35000" />
        </div>
        <div className="flex flex-col gap-2 col-span-2">
          <Label>Especificaciones</Label>
          <Textarea value={specs} onChange={(e) => setSpecs(e.target.value)} rows={3} placeholder="CPU, RAM, disco, OS..." className="resize-none" />
        </div>
        <div className="flex flex-col gap-2 col-span-2">
          <Label>Notas</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Notas adicionales..." className="resize-none" />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={isPending}>{isPending ? 'Guardando...' : item ? 'Actualizar' : 'Registrar equipo'}</Button>
      </DialogFooter>
    </form>
  )
}

export function EquipmentClient({ initialEquipment, categories }: { initialEquipment: Equipment[]; categories: Category[] }) {
  const [items, setItems] = useState(initialEquipment)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterOwnerType, setFilterOwnerType] = useState('all')
  const [isOpen, setIsOpen] = useState(false)
  const [editItem, setEditItem] = useState<Equipment | undefined>()
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]))

  const filtered = items.filter((e) => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
      (e.brand ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (e.model ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (e.serialNumber ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (e.ownerName ?? '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || e.status === filterStatus
    const matchOwner = filterOwnerType === 'all' || e.ownerType === filterOwnerType
    return matchSearch && matchStatus && matchOwner
  })

  const handleDelete = (id: number) => {
    startTransition(async () => {
      await deleteEquipment(id)
      setItems((prev) => prev.filter((e) => e.id !== id))
      setDeleteId(null)
    })
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Equipos & Seriales</h1>
          <p className="text-sm text-muted-foreground mt-1">{items.length} equipo{items.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => { setEditItem(undefined); setIsOpen(true) }} className="gap-2">
          <Plus className="h-4 w-4" /> Registrar equipo
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nombre, marca, serial, propietario..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue>
              {filterStatus === 'all' 
                ? 'Todos los estados' 
                : (STATUS_OPTIONS.find(s => s.value === filterStatus)?.label ?? 'Estado')}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterOwnerType} onValueChange={setFilterOwnerType}>
          <SelectTrigger className="w-36">
            <SelectValue>
              {filterOwnerType === 'all' 
                ? 'Todos' 
                : (OWNER_TYPES.find(o => o.value === filterOwnerType)?.label ?? 'Propietario')}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {OWNER_TYPES.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <HardDrive className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No hay equipos registrados</p>
          <Button variant="outline" className="mt-4" onClick={() => { setEditItem(undefined); setIsOpen(true) }}>
            Registrar primer equipo
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((eq) => {
            const cat = eq.categoryId ? catMap[eq.categoryId] : null
            const statusInfo = STATUS_OPTIONS.find((s) => s.value === eq.status)
            const ownerInfo = OWNER_TYPES.find((o) => o.value === eq.ownerType)
            return (
              <Card key={eq.id} className="p-4">
                <div className="flex items-start gap-4">
                  <div className="bg-muted rounded-lg p-2.5 flex-shrink-0">
                    <HardDrive className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-foreground text-sm">{eq.name}</h3>
                      {eq.brand && <span className="text-xs text-muted-foreground">{eq.brand}</span>}
                      {eq.model && <span className="text-xs text-muted-foreground">{eq.model}</span>}
                      <Badge className={`text-xs border-0 ${statusInfo?.color ?? ''}`}>{statusInfo?.label ?? eq.status}</Badge>
                      <Badge variant="outline" className="text-xs">{ownerInfo?.label ?? eq.ownerType}</Badge>
                      {cat && (
                        <Badge variant="secondary" style={{ backgroundColor: cat.color + '22', color: cat.color }} className="text-xs border-0">
                          {cat.name}
                        </Badge>
                      )}
                    </div>

                    {eq.serialNumber && (
                      <div className="flex items-center gap-1.5 mt-2 bg-muted/50 rounded px-2.5 py-1.5 w-fit max-w-full">
                        <span className="text-xs text-muted-foreground">S/N:</span>
                        <code className="text-xs font-mono text-foreground truncate">{eq.serialNumber}</code>
                        <CopyButton text={eq.serialNumber} />
                      </div>
                    )}

                    <div className="flex items-center gap-4 mt-2 flex-wrap text-xs text-muted-foreground">
                      {eq.ownerName && <span>Propietario: {eq.ownerName}</span>}
                      {eq.capacity && <span>Capacidad: {eq.capacity}</span>}
                      {eq.pricePaid && (
                        <span>
                          Cobrado:{' '}
                          <span className="font-semibold text-emerald-500">
                            {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(eq.pricePaid)}
                          </span>
                        </span>
                      )}
                      {eq.lastMaintenance && <span>Mant.: {new Date(eq.lastMaintenance).toLocaleDateString('es-CL')}</span>}
                      {eq.warrantyExpiry && <span>Garantía: {new Date(eq.warrantyExpiry).toLocaleDateString('es-CL')}</span>}
                    </div>
                    {eq.specs && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{eq.specs}</p>}
                    {eq.notes && <p className="text-xs text-muted-foreground mt-1 italic">{eq.notes}</p>}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditItem(eq); setIsOpen(true) }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(eq.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={(v) => { if (!v) { setIsOpen(false); setEditItem(undefined) } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Editar equipo' : 'Registrar equipo'}</DialogTitle>
          </DialogHeader>
          <EquipmentForm item={editItem} categories={categories} onClose={() => { setIsOpen(false); setEditItem(undefined) }} />
        </DialogContent>
      </Dialog>

      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Eliminar equipo</DialogTitle></DialogHeader>
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
