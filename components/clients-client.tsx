'use client'

import { useState, useTransition, useEffect } from 'react'
import { createClient, updateClient, deleteClient } from '@/app/actions/clients'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, Search, Pencil, Trash2, Users, Phone, Mail, MapPin, Copy, Check } from 'lucide-react'
import type { Client } from '@/lib/db/schema'

function CopyButton({ text, title = "Copiar" }: { text: string; title?: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <Button variant="ghost" size="icon" className="h-6 w-6 inline-flex ml-1 text-muted-foreground/60 hover:text-foreground" onClick={handleCopy} title={title}>
      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
    </Button>
  )
}

function ClientForm({ 
  client, 
  onClose 
}: { 
  client?: Client
  onClose: () => void 
}) {
  const [name, setName] = useState(client?.name ?? '')
  const [phone, setPhone] = useState(client?.phone ?? '')
  const [email, setEmail] = useState(client?.email ?? '')
  const [address, setAddress] = useState(client?.address ?? '')
  const [rut, setRut] = useState(client?.rut ?? '')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    
    startTransition(async () => {
      const data = {
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        rut: rut.trim() || undefined,
      }
      
      if (client) {
        await updateClient(client.id, data)
      } else {
        await createClient(data)
      }
      onClose()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nombre y Apellido</Label>
        <Input 
          id="name" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          required 
          placeholder="Ej: Alfonso Muñoz" 
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="rut">RUT (Opcional)</Label>
        <Input 
          id="rut" 
          value={rut} 
          onChange={(e) => setRut(e.target.value)} 
          placeholder="Ej: 12.345.678-9" 
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">Teléfono</Label>
        <Input 
          id="phone" 
          value={phone} 
          onChange={(e) => setPhone(e.target.value)} 
          placeholder="Ej: +56 9 1234 5678" 
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Correo Electrónico (Opcional)</Label>
        <Input 
          id="email" 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          placeholder="correo@ejemplo.com" 
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="address">Dirección (Opcional)</Label>
        <Input 
          id="address" 
          value={address} 
          onChange={(e) => setAddress(e.target.value)} 
          placeholder="Ej: Av. Providencia 1234, Oficina 50" 
        />
      </div>
      <DialogFooter className="mt-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={isPending}>{isPending ? 'Guardando...' : client ? 'Actualizar' : 'Guardar Cliente'}</Button>
      </DialogFooter>
    </form>
  )
}

export function ClientsClient({ initialClients }: { initialClients: Client[] }) {
  const [clients, setClients] = useState(initialClients)
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [editClient, setEditClient] = useState<Client | undefined>()
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setClients(initialClients)
  }, [initialClients])

  const filtered = clients.filter((c) => {
    return c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (c.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (c.address ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (c.rut ?? '').toLowerCase().includes(search.toLowerCase())
  })

  const handleDelete = (id: number) => {
    startTransition(async () => {
      await deleteClient(id)
      setClients((prev) => prev.filter((c) => c.id !== id))
      setDeleteId(null)
    })
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestión de Clientes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {clients.length} cliente{clients.length !== 1 ? 's' : ''} registrado{clients.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => { setEditClient(undefined); setIsOpen(true) }} className="gap-2">
          <Plus className="h-4 w-4" /> Registrar Cliente
        </Button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar por nombre, teléfono, correo o dirección..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          className="pl-9 w-full"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-xl">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground font-medium">No se encontraron clientes</p>
          <p className="text-xs text-muted-foreground mt-1">Intenta con otra búsqueda o registra un cliente nuevo.</p>
          <Button variant="outline" className="mt-4" onClick={() => { setEditClient(undefined); setIsOpen(true) }}>
            Registrar primer cliente
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((c) => (
            <Card key={c.id} className="p-5 border border-border bg-card hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="bg-primary/10 rounded-lg p-2 text-primary">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">{c.name}</h3>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-muted-foreground">ID: #{c.id}</span>
                        {c.rut && (
                          <span className="text-[10px] text-muted-foreground font-mono bg-secondary px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-border">
                            RUT: {c.rut}
                            <CopyButton text={c.rut} title="Copiar RUT" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-foreground" 
                      onClick={() => { setEditClient(c); setIsOpen(true) }}
                      title="Editar cliente"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" 
                      onClick={() => setDeleteId(c.id)}
                      title="Eliminar cliente"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-muted-foreground mt-4 border-t border-border pt-4">
                  {c.phone && (
                    <div className="flex items-center gap-2 group/item">
                      <Phone className="h-4 w-4 text-muted-foreground/80 flex-shrink-0" />
                      <span className="text-foreground font-medium truncate">{c.phone}</span>
                      <CopyButton text={c.phone} title="Copiar teléfono" />
                    </div>
                  )}
                  {c.email && (
                    <div className="flex items-center gap-2 group/item">
                      <Mail className="h-4 w-4 text-muted-foreground/80 flex-shrink-0" />
                      <span className="text-foreground truncate" title={c.email}>{c.email}</span>
                      <CopyButton text={c.email} title="Copiar correo" />
                    </div>
                  )}
                  {c.address && (
                    <div className="flex items-start gap-2 group/item">
                      <MapPin className="h-4 w-4 text-muted-foreground/80 mt-0.5 flex-shrink-0" />
                      <span className="text-foreground line-clamp-2" title={c.address}>{c.address}</span>
                      <CopyButton text={c.address} title="Copiar dirección" />
                    </div>
                  )}
                  {!c.phone && !c.email && !c.address && (
                    <p className="text-xs italic text-muted-foreground">Sin datos de contacto registrados</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog for Create/Edit */}
      <Dialog open={isOpen} onOpenChange={(v) => { if (!v) { setIsOpen(false); setEditClient(undefined) } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editClient ? 'Editar Cliente' : 'Registrar Cliente'}</DialogTitle>
          </DialogHeader>
          <ClientForm client={editClient} onClose={() => { setIsOpen(false); setEditClient(undefined) }} />
        </DialogContent>
      </Dialog>

      {/* Dialog for Delete */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar Cliente</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Estás seguro de que deseas eliminar este cliente? Se eliminarán también sus equipos, licencias y trabajos asociados de forma permanente.
          </p>
          <DialogFooter className="mt-4">
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
