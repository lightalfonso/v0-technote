'use client'

import { useState, useTransition } from 'react'
import { createSoftwareLicense, updateSoftwareLicense, deleteSoftwareLicense } from '@/app/actions/software'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search, Pencil, Trash2, Laptop, ExternalLink, Copy, Check, Key } from 'lucide-react'
import type { SoftwareLicense, Category } from '@/lib/db/schema'

const LICENSE_TYPES = [
  { value: 'perpetual', label: 'Perpetua' },
  { value: 'subscription', label: 'Suscripción' },
  { value: 'trial', label: 'Prueba' },
  { value: 'free', label: 'Gratuita' },
  { value: 'oem', label: 'OEM' },
  { value: 'volume', label: 'Volumen' },
]

function daysUntilExpiry(dateStr: string | null): number | null {
  if (!dateStr) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const exp = new Date(dateStr)
  return Math.round((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function ExpiryBadge({ dateStr }: { dateStr: string | null }) {
  const days = daysUntilExpiry(dateStr)
  if (days === null) return <Badge variant="outline" className="text-xs">Perpetua</Badge>
  if (days < 0) return <Badge variant="destructive" className="text-xs">Vencida</Badge>
  if (days === 0) return <Badge variant="destructive" className="text-xs">Vence hoy</Badge>
  if (days <= 14) return <Badge variant="destructive" className="text-xs">{days}d restantes</Badge>
  if (days <= 60) return <Badge className="text-xs bg-amber-500 hover:bg-amber-500">{days}d restantes</Badge>
  return <Badge variant="secondary" className="text-xs">{new Date(dateStr!).toLocaleDateString('es-CL')}</Badge>
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy} title="Copiar serial">
      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
    </Button>
  )
}

function LicenseForm({ license, categories, onClose }: { license?: SoftwareLicense; categories: Category[]; onClose: () => void }) {
  const [softwareName, setSoftwareName] = useState(license?.softwareName ?? '')
  const [version, setVersion] = useState(license?.version ?? '')
  const [serialKey, setSerialKey] = useState(license?.serialKey ?? '')
  const [licenseType, setLicenseType] = useState(license?.licenseType ?? 'perpetual')
  const [purchaseDate, setPurchaseDate] = useState(license?.purchaseDate ?? '')
  const [expiryDate, setExpiryDate] = useState(license?.expiryDate ?? '')
  const [maxInstalls, setMaxInstalls] = useState(license?.maxInstalls?.toString() ?? '')
  const [currentInstalls, setCurrentInstalls] = useState(license?.currentInstalls?.toString() ?? '0')
  const [downloadUrl, setDownloadUrl] = useState(license?.downloadUrl ?? '')
  const [notes, setNotes] = useState(license?.notes ?? '')
  const [categoryId, setCategoryId] = useState(license?.categoryId?.toString() ?? '')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const data = {
        softwareName,
        version: version || undefined,
        serialKey: serialKey || undefined,
        licenseType,
        purchaseDate: purchaseDate || undefined,
        expiryDate: expiryDate || undefined,
        maxInstalls: maxInstalls ? parseInt(maxInstalls) : undefined,
        currentInstalls: parseInt(currentInstalls) || 0,
        downloadUrl: downloadUrl || undefined,
        notes: notes || undefined,
        categoryId: categoryId && categoryId !== 'none' ? parseInt(categoryId) : null,
      }
      if (license) {
        await updateSoftwareLicense(license.id, data)
      } else {
        await createSoftwareLicense(data)
      }
      onClose()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2 col-span-2">
          <Label>Nombre del software</Label>
          <Input value={softwareName} onChange={(e) => setSoftwareName(e.target.value)} required placeholder="Windows 11, Office 365..." />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Versión</Label>
          <Input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="Pro, Home, 2021..." />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Tipo de licencia</Label>
          <Select value={licenseType} onValueChange={setLicenseType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {LICENSE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2 col-span-2">
          <Label>Serial / Clave de producto</Label>
          <Input value={serialKey} onChange={(e) => setSerialKey(e.target.value)} placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX" className="font-mono" />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Fecha de compra</Label>
          <Input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Fecha de vencimiento</Label>
          <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Máx. instalaciones</Label>
          <Input type="number" min="1" value={maxInstalls} onChange={(e) => setMaxInstalls(e.target.value)} placeholder="Ilimitado" />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Instalaciones actuales</Label>
          <Input type="number" min="0" value={currentInstalls} onChange={(e) => setCurrentInstalls(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2 col-span-2">
          <Label>URL de descarga</Label>
          <Input value={downloadUrl} onChange={(e) => setDownloadUrl(e.target.value)} placeholder="https://..." />
        </div>
        <div className="flex flex-col gap-2 col-span-2">
          <Label>Categoría</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger><SelectValue placeholder="Sin categoría" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin categoría</SelectItem>
              {categories.map((c) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2 col-span-2">
          <Label>Notas</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Notas adicionales..." className="resize-none" />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={isPending}>{isPending ? 'Guardando...' : license ? 'Actualizar' : 'Agregar licencia'}</Button>
      </DialogFooter>
    </form>
  )
}

export function SoftwareClient({ initialLicenses, categories }: { initialLicenses: SoftwareLicense[]; categories: Category[] }) {
  const [licenses, setLicenses] = useState(initialLicenses)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [isOpen, setIsOpen] = useState(false)
  const [editLicense, setEditLicense] = useState<SoftwareLicense | undefined>()
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]))

  const filtered = licenses.filter((l) => {
    const matchSearch = l.softwareName.toLowerCase().includes(search.toLowerCase()) ||
      (l.serialKey ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (l.version ?? '').toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === 'all' || l.licenseType === filterType
    return matchSearch && matchType
  })

  const handleDelete = (id: number) => {
    startTransition(async () => {
      await deleteSoftwareLicense(id)
      setLicenses((prev) => prev.filter((l) => l.id !== id))
      setDeleteId(null)
    })
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Software & Licencias</h1>
          <p className="text-sm text-muted-foreground mt-1">{licenses.length} licencia{licenses.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => { setEditLicense(undefined); setIsOpen(true) }} className="gap-2">
          <Plus className="h-4 w-4" /> Agregar licencia
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar software, serial..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {LICENSE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Laptop className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No hay licencias registradas</p>
          <Button variant="outline" className="mt-4" onClick={() => { setEditLicense(undefined); setIsOpen(true) }}>
            Agregar primera licencia
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((lic) => {
            const cat = lic.categoryId ? catMap[lic.categoryId] : null
            const licType = LICENSE_TYPES.find((t) => t.value === lic.licenseType)
            const installRatio = lic.maxInstalls ? `${lic.currentInstalls}/${lic.maxInstalls}` : `${lic.currentInstalls} instalaciones`
            return (
              <Card key={lic.id} className="p-4">
                <div className="flex items-start gap-4">
                  <div className="bg-muted rounded-lg p-2.5 flex-shrink-0">
                    <Laptop className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-foreground text-sm">{lic.softwareName}</h3>
                      {lic.version && <span className="text-xs text-muted-foreground">{lic.version}</span>}
                      <Badge variant="outline" className="text-xs">{licType?.label ?? lic.licenseType}</Badge>
                      {cat && (
                        <Badge variant="secondary" style={{ backgroundColor: cat.color + '22', color: cat.color }} className="text-xs border-0">
                          {cat.name}
                        </Badge>
                      )}
                      <ExpiryBadge dateStr={lic.expiryDate} />
                    </div>

                    {lic.serialKey && (
                      <div className="flex items-center gap-1.5 mt-2 bg-muted/50 rounded px-2.5 py-1.5 w-fit max-w-full">
                        <Key className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <code className="text-xs font-mono text-foreground truncate">{lic.serialKey}</code>
                        <CopyButton text={lic.serialKey} />
                      </div>
                    )}

                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">{installRatio}</span>
                      {lic.purchaseDate && (
                        <span className="text-xs text-muted-foreground">
                          Compra: {new Date(lic.purchaseDate).toLocaleDateString('es-CL')}
                        </span>
                      )}
                      {lic.downloadUrl && (
                        <a href={lic.downloadUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" /> Descargar
                        </a>
                      )}
                    </div>
                    {lic.notes && <p className="text-xs text-muted-foreground mt-1.5">{lic.notes}</p>}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditLicense(lic); setIsOpen(true) }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(lic.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={(v) => { if (!v) { setIsOpen(false); setEditLicense(undefined) } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editLicense ? 'Editar licencia' : 'Agregar licencia'}</DialogTitle>
          </DialogHeader>
          <LicenseForm license={editLicense} categories={categories} onClose={() => { setIsOpen(false); setEditLicense(undefined) }} />
        </DialogContent>
      </Dialog>

      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Eliminar licencia</DialogTitle></DialogHeader>
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
