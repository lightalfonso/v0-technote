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
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  Laptop, 
  ExternalLink, 
  Copy, 
  Check, 
  Key, 
  Eye, 
  EyeOff, 
  UserPlus, 
  ShieldCheck, 
  FileText, 
  Download, 
  Calendar,
  Lock,
  Phone,
  DollarSign
} from 'lucide-react'
import type { SoftwareLicense, Category } from '@/lib/db/schema'

const LICENSE_TYPES = [
  { value: 'perpetual', label: 'Perpetua' },
  { value: 'subscription', label: 'Suscripción' },
  { value: 'trial', label: 'Prueba' },
  { value: 'free', label: 'Gratuita' },
  { value: 'oem', label: 'OEM' },
  { value: 'volume', label: 'Volumen' },
]

function formatLocalDate(dateVal: string | Date | null): string {
  if (!dateVal) return ''
  let dateStr = ''
  if (dateVal instanceof Date) {
    dateStr = dateVal.toISOString().slice(0, 10)
  } else {
    dateStr = dateVal
  }
  const parts = dateStr.split('T')[0].split('-')
  if (parts.length !== 3) return dateStr
  const [year, month, day] = parts
  return `${day}-${month}-${year}`
}

function daysUntilExpiry(dateVal: string | Date | null): number | null {
  if (!dateVal) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  let dateStr = ''
  if (dateVal instanceof Date) {
    dateStr = dateVal.toISOString().slice(0, 10)
  } else {
    dateStr = dateVal
  }
  
  const parts = dateStr.split('T')[0].split('-')
  if (parts.length !== 3) return null
  const exp = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
  return Math.round((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function ExpiryBadge({ dateStr }: { dateStr: string | Date | null }) {
  const days = daysUntilExpiry(dateStr)
  if (days === null) return <Badge variant="outline" className="text-xs">Perpetua</Badge>
  if (days < 0) return <Badge variant="destructive" className="text-xs">Vencida</Badge>
  if (days === 0) return <Badge variant="destructive" className="text-xs">Vence hoy</Badge>
  if (days <= 14) return <Badge variant="destructive" className="text-xs">{days}d restantes</Badge>
  if (days <= 60) return <Badge className="text-xs bg-amber-500 hover:bg-amber-500">{days}d restantes</Badge>
  return <Badge variant="secondary" className="text-xs">{formatLocalDate(dateStr)}</Badge>
}

function CopyButton({ text, title = "Copiar serial" }: { text: string; title?: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <Button variant="ghost" size="icon" className="h-6 w-6 inline-flex" onClick={handleCopy} title={title}>
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  )
}

function downloadTxtFile(filename: string, text: string) {
  const element = document.createElement("a");
  const file = new Blob([text], { type: 'text/plain;charset=utf-8' });
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

function exportLicenseToTxt(lic: SoftwareLicense, catName?: string) {
  let txt = `=========================================\n`;
  txt += `LICENCIA: ${lic.softwareName}\n`;
  txt += `=========================================\n`;
  if (lic.version) txt += `Versión: ${lic.version}\n`;
  txt += `Tipo de licencia: ${LICENSE_TYPES.find(t => t.value === lic.licenseType)?.label ?? lic.licenseType}\n`;
  if (catName) txt += `Categoría: ${catName}\n`;
  txt += `Vencimiento: ${lic.expiryDate ? formatLocalDate(lic.expiryDate) : 'Perpetua'}\n`;
  if (lic.serialKey) txt += `Serial: ${lic.serialKey}\n`;
  txt += `Instalaciones: ${lic.currentInstalls}/${lic.maxInstalls ?? 'Ilimitado'}\n`;
  if (lic.purchaseDate) txt += `Fecha de compra: ${formatLocalDate(lic.purchaseDate)}\n`;
  if (lic.downloadUrl) txt += `Enlace de descarga: ${lic.downloadUrl}\n`;
  if (lic.notes) txt += `Notas de licencia: ${lic.notes}\n`;
  
  if (lic.purchasePlace || lic.purchaseUser || lic.purchasePassword) {
    txt += `\nPORTAL DE COMPRA:\n`;
    if (lic.purchasePlace) txt += `- Lugar de compra: ${lic.purchasePlace}\n`;
    if (lic.purchaseUser) txt += `- Usuario del portal: ${lic.purchaseUser}\n`;
    if (lic.purchasePassword) txt += `- Contraseña del portal: ${lic.purchasePassword}\n`;
  }
  
  if (lic.clientName || lic.clientPhone || lic.pricePaid || lic.installationNotes) {
    txt += `\nDATOS DE INSTALACIÓN & CLIENTE:\n`;
    if (lic.clientName) txt += `- Cliente instalado: ${lic.clientName}\n`;
    if (lic.clientPhone) txt += `- Teléfono del cliente: ${lic.clientPhone}\n`;
    if (lic.pricePaid) txt += `- Monto pagado: CLP ${new Intl.NumberFormat('es-CL').format(lic.pricePaid)}\n`;
    if (lic.installationNotes) txt += `- Notas de instalación: ${lic.installationNotes}\n`;
  }
  
  if (lic.warrantyDuration || lic.warrantyCoverage || lic.activationType) {
    txt += `\nGARANTÍA & ACTIVACIÓN:\n`;
    if (lic.activationType) txt += `- Tipo de activación: ${lic.activationType}\n`;
    if (lic.warrantyDuration) txt += `- Garantía: ${lic.warrantyDuration}\n`;
    if (lic.warrantyCoverage) txt += `- Cobertura: ${lic.warrantyCoverage}\n`;
  }
  txt += `=========================================\n`;
  return txt;
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
  
  // New States
  const [purchasePlace, setPurchasePlace] = useState(license?.purchasePlace ?? '')
  const [purchaseUser, setPurchaseUser] = useState(license?.purchaseUser ?? '')
  const [purchasePassword, setPurchasePassword] = useState(license?.purchasePassword ?? '')
  const [clientName, setClientName] = useState(license?.clientName ?? '')
  const [clientPhone, setClientPhone] = useState(license?.clientPhone ?? '')
  const [pricePaid, setPricePaid] = useState(license?.pricePaid?.toString() ?? '')
  const [installationNotes, setInstallationNotes] = useState(license?.installationNotes ?? '')
  const [warrantyDuration, setWarrantyDuration] = useState(license?.warrantyDuration ?? '')
  const [warrantyCoverage, setWarrantyCoverage] = useState(license?.warrantyCoverage ?? '')
  const [activationType, setActivationType] = useState(license?.activationType ?? '')
  
  const [showPurchasePass, setShowPurchasePass] = useState(false)
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
        purchasePlace: purchasePlace || undefined,
        purchaseUser: purchaseUser || undefined,
        purchasePassword: purchasePassword || undefined,
        clientName: clientName || undefined,
        clientPhone: clientPhone || undefined,
        pricePaid: pricePaid ? parseInt(pricePaid) : undefined,
        installationNotes: installationNotes || undefined,
        warrantyDuration: warrantyDuration || undefined,
        warrantyCoverage: warrantyCoverage || undefined,
        activationType: activationType || undefined,
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
          <Label>Notas de Licencia</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Notas de la licencia..." className="resize-none" />
        </div>

        {/* Portal de Compra */}
        <div className="col-span-2 border-t border-border pt-3 mt-1">
          <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Portal de Compra</h4>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Lugar de compra</Label>
          <Input value={purchasePlace} onChange={(e) => setPurchasePlace(e.target.value)} placeholder="Ej: Microsoft Store, Ebay..." />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Usuario de compra</Label>
          <Input value={purchaseUser} onChange={(e) => setPurchaseUser(e.target.value)} placeholder="Nombre de usuario o correo" />
        </div>
        <div className="flex flex-col gap-2 col-span-2">
          <Label>Contraseña de compra</Label>
          <div className="relative">
            <Input 
              type={showPurchasePass ? "text" : "password"} 
              value={purchasePassword} 
              onChange={(e) => setPurchasePassword(e.target.value)} 
              placeholder="Contraseña en portal de compra" 
              className="pr-9"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPurchasePass(!showPurchasePass)}
            >
              {showPurchasePass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Datos de Instalación & Cliente */}
        <div className="col-span-2 border-t border-border pt-3 mt-1">
          <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Instalación & Cliente</h4>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Cliente instalado</Label>
          <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Nombre del cliente" />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Teléfono del cliente</Label>
          <Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="Ej: +56 9 1234 5678" />
        </div>
        <div className="flex flex-col gap-2 col-span-2">
          <Label>Cuánto pagó (CLP)</Label>
          <Input type="number" value={pricePaid} onChange={(e) => setPricePaid(e.target.value)} placeholder="Ej: 35000" />
        </div>

        {/* Garantía & Activación */}
        <div className="col-span-2 border-t border-border pt-3 mt-1">
          <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Garantía & Activación</h4>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Tiempo de garantía</Label>
          <Input value={warrantyDuration} onChange={(e) => setWarrantyDuration(e.target.value)} placeholder="Ej: 12 meses, de por vida..." />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Cobertura de garantía</Label>
          <Input value={warrantyCoverage} onChange={(e) => setWarrantyCoverage(e.target.value)} placeholder="Ej: Fallo de serial, renovación..." />
        </div>
        <div className="flex flex-col gap-2 col-span-2">
          <Label>Tipo de activación</Label>
          <Input value={activationType} onChange={(e) => setActivationType(e.target.value)} placeholder="Ej: Por teléfono (Office), Online, KMS" />
        </div>

        {/* Notas de Instalación */}
        <div className="col-span-2 border-t border-border pt-3 mt-1">
          <Label>Notas de la instalación</Label>
          <Textarea value={installationNotes} onChange={(e) => setInstallationNotes(e.target.value)} rows={2} placeholder="Detalles de instalación o equipo..." className="resize-none" />
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
  
  // Search & filter states
  const [search, setSearch] = useState('')
  const [filterClient, setFilterClient] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [filterType, setFilterType] = useState('all')
  
  const [isOpen, setIsOpen] = useState(false)
  const [editLicense, setEditLicense] = useState<SoftwareLicense | undefined>()
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({})
  const [isPending, startTransition] = useTransition()

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]))

  const filtered = licenses.filter((l) => {
    const matchSearch = l.softwareName.toLowerCase().includes(search.toLowerCase()) ||
      (l.serialKey ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (l.version ?? '').toLowerCase().includes(search.toLowerCase())
    
    const matchType = filterType === 'all' || l.licenseType === filterType
    
    const matchClient = !filterClient || 
      (l.clientName ?? '').toLowerCase().includes(filterClient.toLowerCase())
      
    const matchDateFrom = !filterDateFrom || (l.purchaseDate && l.purchaseDate >= filterDateFrom)
    const matchDateTo = !filterDateTo || (l.purchaseDate && l.purchaseDate <= filterDateTo)
    
    return matchSearch && matchType && matchClient && !!matchDateFrom && !!matchDateTo
  })

  const handleDelete = (id: number) => {
    startTransition(async () => {
      await deleteSoftwareLicense(id)
      setLicenses((prev) => prev.filter((l) => l.id !== id))
      setDeleteId(null)
    })
  }

  const handleExportAll = () => {
    let fullTxt = `=========================================\n`;
    fullTxt += `   REPORTE DE LICENCIAS DE SOFTWARE      \n`;
    fullTxt += `=========================================\n`;
    fullTxt += `Generado el: ${new Date().toLocaleDateString('es-CL')} ${new Date().toLocaleTimeString('es-CL')}\n`;
    fullTxt += `Total licencias filtradas: ${filtered.length}\n\n`;
    
    filtered.forEach((lic) => {
      const cat = lic.categoryId ? catMap[lic.categoryId] : null;
      fullTxt += exportLicenseToTxt(lic, cat?.name);
      fullTxt += `\n`;
    });
    
    downloadTxtFile(`licencias-filtradas-${new Date().toISOString().slice(0, 10)}.txt`, fullTxt);
  }

  const handleExportSingle = (lic: SoftwareLicense) => {
    const cat = lic.categoryId ? catMap[lic.categoryId] : null;
    const txt = exportLicenseToTxt(lic, cat?.name);
    downloadTxtFile(`licencia-${lic.softwareName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.txt`, txt);
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Software & Licencias</h1>
          <p className="text-sm text-muted-foreground mt-1">{licenses.length} licencia{licenses.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleExportAll} disabled={filtered.length === 0}>
            <Download className="h-4 w-4" /> Exportar Filtrados (.txt)
          </Button>
          <Button onClick={() => { setEditLicense(undefined); setIsOpen(true) }} className="gap-2">
            <Plus className="h-4 w-4" /> Agregar licencia
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-6 bg-card border border-border p-4 rounded-xl shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar software, serial..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="relative">
          <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Filtrar por cliente..." value={filterClient} onChange={(e) => setFilterClient(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Tipo Licencia" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {LICENSE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1.5 border border-border px-2 rounded-lg bg-secondary/30">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1 flex flex-col">
            <span className="text-[10px] text-muted-foreground font-semibold px-0.5">Desde</span>
            <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="bg-transparent border-0 text-xs text-foreground focus:outline-none focus:ring-0 w-full" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 border border-border px-2 rounded-lg bg-secondary/30">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1 flex flex-col">
            <span className="text-[10px] text-muted-foreground font-semibold px-0.5">Hasta</span>
            <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="bg-transparent border-0 text-xs text-foreground focus:outline-none focus:ring-0 w-full" />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Laptop className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No hay licencias registradas que coincidan con los filtros</p>
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
              <Card key={lic.id} className="p-4 bg-card hover:shadow-md transition-all border-border border">
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
                          Compra: {formatLocalDate(lic.purchaseDate)}
                        </span>
                      )}
                      {lic.downloadUrl && (
                        <div className="flex items-center gap-1">
                          <a href={lic.downloadUrl} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" /> Descargar
                          </a>
                          <CopyButton text={lic.downloadUrl} title="Copiar enlace de descarga" />
                        </div>
                      )}
                    </div>
                    {lic.notes && <p className="text-xs text-muted-foreground mt-1.5">{lic.notes}</p>}

                    {/* Detalles Adicionales */}
                    <div className="mt-3 pt-3 border-t border-border grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                      {/* Portal de Compra */}
                      {(lic.purchasePlace || lic.purchaseUser || lic.purchasePassword) && (
                        <div className="bg-secondary/40 p-2.5 rounded-lg border border-border/50">
                          <p className="font-semibold text-primary mb-1.5 flex items-center gap-1.5">
                            <Lock className="h-3.5 w-3.5" /> Portal de Compra
                          </p>
                          <div className="space-y-1">
                            {lic.purchasePlace && <p><span className="text-muted-foreground">Lugar:</span> {lic.purchasePlace}</p>}
                            {lic.purchaseUser && <p><span className="text-muted-foreground">Usuario:</span> {lic.purchaseUser}</p>}
                            {lic.purchasePassword && (
                              <p className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-muted-foreground">Clave:</span>
                                <span className="font-mono bg-background px-1.5 py-0.5 rounded border border-border">
                                  {showPasswords[lic.id] ? lic.purchasePassword : '••••••••'}
                                </span>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-5 w-5 p-0" 
                                  onClick={() => setShowPasswords(prev => ({ ...prev, [lic.id]: !prev[lic.id] }))}
                                >
                                  {showPasswords[lic.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                </Button>
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Instalación & Cliente */}
                      {(lic.clientName || lic.clientPhone || lic.pricePaid || lic.installationNotes) && (
                        <div className="bg-secondary/40 p-2.5 rounded-lg border border-border/50 col-span-1 md:col-span-2 lg:col-span-1">
                          <p className="font-semibold text-primary mb-1.5 flex items-center gap-1.5">
                            <UserPlus className="h-3.5 w-3.5" /> Instalación & Cliente
                          </p>
                          <div className="space-y-1">
                            {lic.clientName && <p><span className="text-muted-foreground">Cliente:</span> {lic.clientName}</p>}
                            {lic.clientPhone && <p><span className="text-muted-foreground">Teléfono:</span> {lic.clientPhone}</p>}
                            {lic.pricePaid && (
                              <p>
                                <span className="text-muted-foreground">Pagó:</span>{' '}
                                <span className="font-medium text-emerald-500">
                                  {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(lic.pricePaid)}
                                </span>
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Garantía & Activación */}
                      {(lic.warrantyDuration || lic.warrantyCoverage || lic.activationType) && (
                        <div className="bg-secondary/40 p-2.5 rounded-lg border border-border/50">
                          <p className="font-semibold text-primary mb-1.5 flex items-center gap-1.5">
                            <ShieldCheck className="h-3.5 w-3.5" /> Garantía & Activación
                          </p>
                          <div className="space-y-1">
                            {lic.activationType && <p><span className="text-muted-foreground">Activación:</span> <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">{lic.activationType}</Badge></p>}
                            {lic.warrantyDuration && <p><span className="text-muted-foreground">Garantía:</span> {lic.warrantyDuration}</p>}
                            {lic.warrantyCoverage && <p><span className="text-muted-foreground">Cobertura:</span> {lic.warrantyCoverage}</p>}
                          </div>
                        </div>
                      )}

                      {/* Notas específicas de instalación */}
                      {lic.installationNotes && (
                        <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-secondary/20 p-2.5 rounded-lg border border-border/30">
                          <p className="font-semibold text-muted-foreground mb-1 flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5" /> Notas de instalación
                          </p>
                          <p className="text-muted-foreground whitespace-pre-wrap">{lic.installationNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleExportSingle(lic)} title="Exportar a TXT">
                      <Download className="h-3.5 w-3.5" />
                    </Button>
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
