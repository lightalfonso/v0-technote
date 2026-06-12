'use client'

import { useState, useTransition, useEffect, useMemo } from 'react'
import { createSoftwareLicense, updateSoftwareLicense, deleteSoftwareLicense } from '@/app/actions/software'
import { createClient } from '@/app/actions/clients'
import { createEquipment, updateEquipment } from '@/app/actions/equipment'
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
  DollarSign,
  Briefcase
} from 'lucide-react'
import type { SoftwareLicense, Category, Client, Equipment, Job } from '@/lib/db/schema'

const LICENSE_TYPES = [
  { value: 'perpetual', label: 'Perpetua' },
  { value: 'subscription', label: 'Suscripción' },
  { value: 'trial', label: 'Prueba' },
  { value: 'free', label: 'Gratuita' },
  { value: 'oem', label: 'OEM' },
  { value: 'volume', label: 'Volumen' },
]

function getIsoDateString(dateVal: string | Date | null): string {
  if (!dateVal) return ''
  if (dateVal instanceof Date) {
    if (dateVal.getUTCHours() === 0 && dateVal.getUTCMinutes() === 0 && dateVal.getUTCSeconds() === 0) {
      const year = dateVal.getUTCFullYear()
      const month = String(dateVal.getUTCMonth() + 1).padStart(2, '0')
      const day = String(dateVal.getUTCDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    } else {
      const year = dateVal.getFullYear()
      const month = String(dateVal.getMonth() + 1).padStart(2, '0')
      const day = String(dateVal.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
  }
  return dateVal.split('T')[0]
}

function formatLocalDate(dateVal: string | Date | null): string {
  if (!dateVal) return ''
  let year = ''
  let month = ''
  let day = ''

  if (dateVal instanceof Date) {
    if (dateVal.getUTCHours() === 0 && dateVal.getUTCMinutes() === 0 && dateVal.getUTCSeconds() === 0) {
      year = dateVal.getUTCFullYear().toString()
      month = String(dateVal.getUTCMonth() + 1).padStart(2, '0')
      day = String(dateVal.getUTCDate()).padStart(2, '0')
    } else {
      year = dateVal.getFullYear().toString()
      month = String(dateVal.getMonth() + 1).padStart(2, '0')
      day = String(dateVal.getDate()).padStart(2, '0')
    }
  } else {
    const dateStr = dateVal
    const parts = dateStr.split('T')[0].split('-')
    if (parts.length === 3) {
      const [y, m, d] = parts
      year = y
      month = m
      day = d
    } else {
      return dateStr
    }
  }

  return `${day}-${month}-${year}`
}

function daysUntilExpiry(dateVal: string | Date | null): number | null {
  if (!dateVal) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const dateStr = getIsoDateString(dateVal)
  const parts = dateStr.split('-')
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

function exportLicenseToTxt(
  lic: SoftwareLicense, 
  catName?: string, 
  clientObj?: Client | null, 
  equipObj?: Equipment | null,
  jobObj?: Job | null
) {
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
  
  if (lic.purchasePlace || lic.purchaseUrl || lic.purchaseUser || lic.purchasePassword) {
    txt += `\nPORTAL DE COMPRA:\n`;
    if (lic.purchasePlace) txt += `- Lugar de compra: ${lic.purchasePlace}\n`;
    if (lic.purchaseUrl) txt += `- URL del portal: ${lic.purchaseUrl}\n`;
    if (lic.purchaseUser) txt += `- Usuario del portal: ${lic.purchaseUser}\n`;
    if (lic.purchasePassword) txt += `- Contraseña del portal: ${lic.purchasePassword}\n`;
  }
  
  const dispName = clientObj?.name || lic.clientName
  const dispPhone = clientObj?.phone || lic.clientPhone
  if (dispName || dispPhone || equipObj || lic.pricePaid || lic.installationNotes || jobObj) {
    txt += `\nDATOS DE INSTALACIÓN & CLIENTE:\n`;
    if (dispName) txt += `- Cliente instalado: ${dispName}\n`;
    if (dispPhone) txt += `- Teléfono del cliente: ${dispPhone}\n`;
    if (equipObj) txt += `- Equipo: ${equipObj.name}${equipObj.brand || equipObj.model ? ` (${[equipObj.brand, equipObj.model].filter(Boolean).join(' ')})` : ''}\n`;
    if (jobObj) txt += `- Trabajo Asociado: ${jobObj.title} (${formatLocalDate(jobObj.jobDate)})\n`;
    if (lic.pricePaid) txt += `- Cobro por licencia: CLP ${new Intl.NumberFormat('es-CL').format(lic.pricePaid)}\n`;
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

function LicenseForm({ 
  license, 
  categories, 
  clients, 
  equipment, 
  jobs,
  onClose 
}: { 
  license?: SoftwareLicense; 
  categories: Category[]; 
  clients: Client[];
  equipment: Equipment[];
  jobs: Job[];
  onClose: () => void 
}) {
  const [softwareName, setSoftwareName] = useState(license?.softwareName ?? '')
  const [version, setVersion] = useState(license?.version ?? '')
  const [serialKey, setSerialKey] = useState(license?.serialKey ?? '')
  const [licenseType, setLicenseType] = useState(license?.licenseType ?? 'perpetual')
  const [purchaseDate, setPurchaseDate] = useState(license ? getIsoDateString(license.purchaseDate) : '')
  const [expiryDate, setExpiryDate] = useState(license ? getIsoDateString(license.expiryDate) : '')
  const [maxInstalls, setMaxInstalls] = useState(license?.maxInstalls?.toString() ?? '')
  const [currentInstalls, setCurrentInstalls] = useState(license?.currentInstalls?.toString() ?? '0')
  const [downloadUrl, setDownloadUrl] = useState(license?.downloadUrl ?? '')
  const [notes, setNotes] = useState(license?.notes ?? '')
  const [categoryId, setCategoryId] = useState(license?.categoryId?.toString() ?? '')
  
  // Purchase Portal
  const [purchasePlace, setPurchasePlace] = useState(license?.purchasePlace ?? '')
  const [purchaseUrl, setPurchaseUrl] = useState(license?.purchaseUrl ?? '')
  const [purchaseUser, setPurchaseUser] = useState(license?.purchaseUser ?? '')
  const [purchasePassword, setPurchasePassword] = useState(license?.purchasePassword ?? '')
  
  // Client, Equipment and Job Selection
  const [clientSelection, setClientSelection] = useState<string>(
    license?.clientId?.toString() ?? 'none'
  )
  const [newClientName, setNewClientName] = useState('')
  const [newClientPhone, setNewClientPhone] = useState('')
  const [newClientEmail, setNewClientEmail] = useState('')
  const [newClientAddress, setNewClientAddress] = useState('')
  const [newClientRut, setNewClientRut] = useState('')
  
  const [equipmentSelection, setEquipmentSelection] = useState<string>(
    license?.equipmentId?.toString() ?? 'none'
  )
  const [newEquipmentName, setNewEquipmentName] = useState('Notebook')
  const [customEquipmentType, setCustomEquipmentType] = useState('')
  const [newEquipmentBrand, setNewEquipmentBrand] = useState('')
  const [newEquipmentModel, setNewEquipmentModel] = useState('')
  const [newEquipmentSerial, setNewEquipmentSerial] = useState('')
  const [newEquipmentNotes, setNewEquipmentNotes] = useState('')
  const [createEquipmentForNewClient, setCreateEquipmentForNewClient] = useState(false)
  const [newEquipmentPricePaid, setNewEquipmentPricePaid] = useState('')
  const [equipPricePaid, setEquipPricePaid] = useState('')

  const [jobSelection, setJobSelection] = useState<string>(
    license?.jobId?.toString() ?? 'none'
  )

  // Details
  const [pricePaid, setPricePaid] = useState(license?.pricePaid?.toString() ?? '')
  const [installationNotes, setInstallationNotes] = useState(license?.installationNotes ?? '')
  const [warrantyDuration, setWarrantyDuration] = useState(license?.warrantyDuration ?? '')
  const [warrantyCoverage, setWarrantyCoverage] = useState(license?.warrantyCoverage ?? '')
  const [activationType, setActivationType] = useState(license?.activationType ?? '')
  
  const [showPurchasePass, setShowPurchasePass] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Filter equipment related to selected client (loose comparison)
  const clientEquipment = useMemo(() => {
    if (clientSelection === 'none' || clientSelection === 'new') return []
    const cidStr = clientSelection.toString()
    return equipment.filter(e => e.clientId?.toString() === cidStr)
  }, [equipment, clientSelection])

  // Filter jobs related to selected client
  const clientJobs = useMemo(() => {
    if (clientSelection === 'none' || clientSelection === 'new') return []
    const cidStr = clientSelection.toString()
    return jobs.filter(j => j.clientId?.toString() === cidStr)
  }, [jobs, clientSelection])

  // Sync equipment and job selections when client changes
  useEffect(() => {
    if (clientSelection === 'none' || clientSelection === 'new') {
      setEquipmentSelection('none')
      setJobSelection('none')
    } else {
      const cidStr = clientSelection.toString()
      
      const isEquipValid = clientEquipment.some(e => e.id.toString() === equipmentSelection.toString())
      if (!isEquipValid && equipmentSelection !== 'none' && equipmentSelection !== 'new') {
        setEquipmentSelection('none')
      }

      const isJobValid = clientJobs.some(j => j.id.toString() === jobSelection.toString())
      if (!isJobValid && jobSelection !== 'none') {
        setJobSelection('none')
      }
    }
  }, [clientSelection, clientEquipment, clientJobs, equipmentSelection, jobSelection])

  // Sync pricePaid input when selected equipment changes
  useEffect(() => {
    if (equipmentSelection !== 'none' && equipmentSelection !== 'new') {
      const eq = equipment.find(e => e.id.toString() === equipmentSelection.toString())
      setEquipPricePaid(eq?.pricePaid?.toString() ?? '')
    } else {
      setEquipPricePaid('')
    }
  }, [equipmentSelection, equipment])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      let finalClientId: number | null = null
      let finalEquipmentId: number | null = null
      let finalClientName = ''
      let finalClientPhone = ''

      // 1. Client flow
      if (clientSelection === 'new') {
        if (!newClientName.trim()) return
        const createdClient = await createClient({
          name: newClientName.trim(),
          phone: newClientPhone.trim() || undefined,
          email: newClientEmail.trim() || undefined,
          address: newClientAddress.trim() || undefined,
          rut: newClientRut.trim() || undefined,
        })
        if (createdClient?.id) {
          finalClientId = createdClient.id
          finalClientName = newClientName.trim()
          finalClientPhone = newClientPhone.trim()
        }
      } else if (clientSelection !== 'none') {
        const cid = parseInt(clientSelection)
        finalClientId = cid
        const selectedClient = clients.find(c => c.id === cid)
        if (selectedClient) {
          finalClientName = selectedClient.name
          finalClientPhone = selectedClient.phone ?? ''
        }
      }

      // 2. Equipment flow
      const eqName = newEquipmentName === 'Otro' ? customEquipmentType.trim() : newEquipmentName
      if (clientSelection === 'new') {
        if (createEquipmentForNewClient && eqName.trim()) {
          const createdEquip = await createEquipment({
            name: eqName.trim(),
            brand: newEquipmentBrand.trim() || undefined,
            model: newEquipmentModel.trim() || undefined,
            serialNumber: newEquipmentSerial.trim() || undefined,
            notes: newEquipmentNotes.trim() || undefined,
            clientId: finalClientId,
            ownerName: finalClientName || undefined,
            ownerType: 'client',
            pricePaid: newEquipmentPricePaid ? parseInt(newEquipmentPricePaid) : null,
          })
          if (createdEquip?.id) {
            finalEquipmentId = createdEquip.id
          }
        }
      } else if (clientSelection !== 'none') {
        if (equipmentSelection === 'new') {
          if (!eqName.trim()) return
          const createdEquip = await createEquipment({
            name: eqName.trim(),
            brand: newEquipmentBrand.trim() || undefined,
            model: newEquipmentModel.trim() || undefined,
            serialNumber: newEquipmentSerial.trim() || undefined,
            notes: newEquipmentNotes.trim() || undefined,
            clientId: finalClientId,
            ownerName: finalClientName || undefined,
            ownerType: 'client',
            pricePaid: newEquipmentPricePaid ? parseInt(newEquipmentPricePaid) : null,
          })
          if (createdEquip?.id) {
            finalEquipmentId = createdEquip.id
          }
        } else if (equipmentSelection !== 'none') {
          finalEquipmentId = parseInt(equipmentSelection)
          // Update existing equipment price if edited
          const eq = equipment.find(e => e.id.toString() === equipmentSelection.toString())
          if (eq && eq.pricePaid?.toString() !== equipPricePaid) {
            await updateEquipment(finalEquipmentId, {
              pricePaid: equipPricePaid ? parseInt(equipPricePaid) : null
            })
          }
        }
      }

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
        purchaseUrl: purchaseUrl || undefined,
        purchaseUser: purchaseUser || undefined,
        purchasePassword: purchasePassword || undefined,
        clientName: finalClientName || undefined,
        clientPhone: finalClientPhone || undefined,
        pricePaid: pricePaid ? parseInt(pricePaid) : undefined,
        installationNotes: installationNotes || undefined,
        warrantyDuration: warrantyDuration || undefined,
        warrantyCoverage: warrantyCoverage || undefined,
        activationType: activationType || undefined,
        clientId: finalClientId,
        equipmentId: finalEquipmentId,
        jobId: jobSelection === 'none' ? null : parseInt(jobSelection),
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
            <SelectTrigger>
              <SelectValue>
                {LICENSE_TYPES.find(t => t.value === licenseType)?.label ?? 'Seleccione tipo'}
              </SelectValue>
            </SelectTrigger>
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
          <Label>URL del portal de compra</Label>
          <Input value={purchaseUrl} onChange={(e) => setPurchaseUrl(e.target.value)} placeholder="https://..." />
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
        <div className="flex flex-col gap-2 col-span-2">
          <Label>Seleccionar Cliente</Label>
          <Select value={clientSelection} onValueChange={setClientSelection}>
            <SelectTrigger>
              <SelectValue>
                {clientSelection === 'none'
                  ? 'Sin cliente asignado'
                  : clientSelection === 'new'
                    ? '➕ Crear nuevo cliente...'
                    : (clients.find(c => c.id.toString() === clientSelection.toString())?.name ?? 'Seleccione cliente')}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin cliente asignado</SelectItem>
              <SelectItem value="new">➕ Crear nuevo cliente...</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id.toString()}>
                  {c.name} {c.phone ? `(${c.phone})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {clientSelection === 'new' && (
          <div className="col-span-2 grid grid-cols-2 gap-3 bg-secondary/10 p-3 rounded-lg border border-border">
            <div className="col-span-2">
              <h5 className="text-xs font-semibold text-foreground">Detalles del Nuevo Cliente</h5>
            </div>
            <div className="flex flex-col gap-2 col-span-2">
              <Label>Nombre y Apellido</Label>
              <Input 
                value={newClientName} 
                onChange={(e) => setNewClientName(e.target.value)} 
                placeholder="Ej: Alfonso Muñoz" 
                required={clientSelection === 'new'}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Teléfono</Label>
              <Input 
                value={newClientPhone} 
                onChange={(e) => setNewClientPhone(e.target.value)} 
                placeholder="Ej: +56 9 1234 5678" 
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>RUT (Opcional)</Label>
              <Input 
                value={newClientRut} 
                onChange={(e) => setNewClientRut(e.target.value)} 
                placeholder="Ej: 12.345.678-9" 
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Correo (Opcional)</Label>
              <Input 
                value={newClientEmail} 
                onChange={(e) => setNewClientEmail(e.target.value)} 
                placeholder="correo@ejemplo.com" 
              />
            </div>
            <div className="flex flex-col gap-2 col-span-2">
              <Label>Dirección (Opcional)</Label>
              <Input 
                value={newClientAddress} 
                onChange={(e) => setNewClientAddress(e.target.value)} 
                placeholder="Ej: Av. Providencia 1234, Oficina 50" 
              />
            </div>
            <div className="col-span-2 flex items-center gap-2 mt-1">
              <input 
                type="checkbox" 
                id="createEquipmentForNewClient" 
                checked={createEquipmentForNewClient} 
                onChange={(e) => setCreateEquipmentForNewClient(e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
              />
              <Label htmlFor="createEquipmentForNewClient" className="cursor-pointer font-normal text-xs text-muted-foreground">
                Registrar también un equipo para este nuevo cliente
              </Label>
            </div>
            {createEquipmentForNewClient && (
              <div className="col-span-2 grid grid-cols-2 gap-3 bg-secondary/20 p-3 rounded-lg border border-border mt-1">
                <div className="col-span-2">
                  <h5 className="text-xs font-semibold text-foreground">Detalles del Nuevo Equipo</h5>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Tipo de Equipo</Label>
                  <Select value={newEquipmentName} onValueChange={setNewEquipmentName}>
                    <SelectTrigger>
                      <SelectValue>{newEquipmentName}</SelectValue>
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
                {newEquipmentName === 'Otro' ? (
                  <div className="flex flex-col gap-2">
                    <Label>Escribe el tipo de equipo</Label>
                    <Input 
                      value={customEquipmentType} 
                      onChange={(e) => setCustomEquipmentType(e.target.value)} 
                      placeholder="Ej: Servidor, Access Point" 
                      required={newEquipmentName === 'Otro'}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 justify-end">
                    <p className="text-xs text-muted-foreground italic mb-2">Se creará como tipo: {newEquipmentName}</p>
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <Label>Marca (Opcional)</Label>
                  <Input 
                    value={newEquipmentBrand} 
                    onChange={(e) => setNewEquipmentBrand(e.target.value)} 
                    placeholder="Ej: HP" 
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Modelo (Opcional)</Label>
                  <Input 
                    value={newEquipmentModel} 
                    onChange={(e) => setNewEquipmentModel(e.target.value)} 
                    placeholder="Ej: EliteBook G3" 
                  />
                </div>
                <div className="flex flex-col gap-2 col-span-2">
                  <Label>Número de Serie (Opcional)</Label>
                  <Input 
                    value={newEquipmentSerial} 
                    onChange={(e) => setNewEquipmentSerial(e.target.value)} 
                    placeholder="Ej: S/N 12345" 
                  />
                </div>
                <div className="flex flex-col gap-2 col-span-2">
                  <Label>Notas del Equipo (Opcional)</Label>
                  <Textarea 
                    value={newEquipmentNotes} 
                    onChange={(e) => setNewEquipmentNotes(e.target.value)} 
                    rows={2}
                    placeholder="Notas o estado físico..." 
                    className="resize-none"
                  />
                </div>
                <div className="flex flex-col gap-2 col-span-2">
                  <Label>Monto cobrado por este equipo (CLP)</Label>
                  <Input 
                    type="number" 
                    value={newEquipmentPricePaid} 
                    onChange={(e) => setNewEquipmentPricePaid(e.target.value)} 
                    placeholder="Ej: 35000" 
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {clientSelection !== 'none' && clientSelection !== 'new' && (
          <>
            <div className="col-span-2 text-xs text-muted-foreground bg-muted/50 p-2.5 rounded border border-border flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-primary" />
              <span>
                <strong>Cliente seleccionado:</strong> {clients.find(c => c.id.toString() === clientSelection.toString())?.name || ''} 
                {clients.find(c => c.id.toString() === clientSelection.toString())?.phone ? ` | Teléfono: ${clients.find(c => c.id.toString() === clientSelection.toString())?.phone}` : ''}
              </span>
            </div>

            <div className="flex flex-col gap-2 col-span-2">
              <Label>Equipo del Cliente</Label>
              <Select value={equipmentSelection} onValueChange={setEquipmentSelection}>
                <SelectTrigger>
                  <SelectValue>
                    {equipmentSelection === 'none'
                      ? 'Sin equipo asignado'
                      : equipmentSelection === 'new'
                        ? '➕ Registrar nuevo equipo...'
                        : (equipment.find(e => e.id.toString() === equipmentSelection.toString())?.name ?? 'Seleccione equipo')}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin equipo asignado</SelectItem>
                  <SelectItem value="new">➕ Registrar nuevo equipo...</SelectItem>
                  {clientEquipment.map((e) => (
                    <SelectItem key={e.id} value={e.id.toString()}>
                      {e.name} {e.brand || e.model ? `(${[e.brand, e.model].filter(Boolean).join(' ')})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {equipmentSelection === 'new' && (
              <div className="col-span-2 grid grid-cols-2 gap-3 bg-secondary/20 p-3 rounded-lg border border-border/50 mt-1">
                <div className="col-span-2">
                  <h5 className="text-xs font-semibold text-foreground">Detalles del Nuevo Equipo</h5>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Tipo de Equipo</Label>
                  <Select value={newEquipmentName} onValueChange={setNewEquipmentName}>
                    <SelectTrigger>
                      <SelectValue>{newEquipmentName}</SelectValue>
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
                {newEquipmentName === 'Otro' ? (
                  <div className="flex flex-col gap-2">
                    <Label>Escribe el tipo de equipo</Label>
                    <Input 
                      value={customEquipmentType} 
                      onChange={(e) => setCustomEquipmentType(e.target.value)} 
                      placeholder="Ej: Servidor, Access Point" 
                      required={equipmentSelection === 'new' && newEquipmentName === 'Otro'}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 justify-end">
                    <p className="text-xs text-muted-foreground italic mb-2">Se creará como tipo: {newEquipmentName}</p>
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <Label>Marca (Opcional)</Label>
                  <Input 
                    value={newEquipmentBrand} 
                    onChange={(e) => setNewEquipmentBrand(e.target.value)} 
                    placeholder="Ej: HP" 
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Modelo (Opcional)</Label>
                  <Input 
                    value={newEquipmentModel} 
                    onChange={(e) => setNewEquipmentModel(e.target.value)} 
                    placeholder="Ej: EliteBook G3" 
                  />
                </div>
                <div className="flex flex-col gap-2 col-span-2">
                  <Label>Número de Serie (Opcional)</Label>
                  <Input 
                    value={newEquipmentSerial} 
                    onChange={(e) => setNewEquipmentSerial(e.target.value)} 
                    placeholder="Ej: S/N 12345" 
                  />
                </div>
                <div className="flex flex-col gap-2 col-span-2">
                  <Label>Notas del Equipo (Opcional)</Label>
                  <Textarea 
                    value={newEquipmentNotes} 
                    onChange={(e) => setNewEquipmentNotes(e.target.value)} 
                    rows={2}
                    placeholder="Notas o estado físico..." 
                    className="resize-none"
                  />
                </div>
                <div className="flex flex-col gap-2 col-span-2">
                  <Label>Monto cobrado por este equipo (CLP)</Label>
                  <Input 
                    type="number" 
                    value={newEquipmentPricePaid} 
                    onChange={(e) => setNewEquipmentPricePaid(e.target.value)} 
                    placeholder="Ej: 35000" 
                  />
                </div>
              </div>
            )}

            {equipmentSelection !== 'none' && equipmentSelection !== 'new' && (
              <div className="flex flex-col gap-2 col-span-2 bg-secondary/10 p-2.5 rounded border border-border/50">
                <Label>Monto cobrado por este equipo (CLP)</Label>
                <Input 
                  type="number" 
                  value={equipPricePaid} 
                  onChange={(e) => setEquipPricePaid(e.target.value)} 
                  placeholder="Ej: 35000" 
                />
                <span className="text-[10px] text-muted-foreground">
                  Nota: Modificar este monto actualizará el cobro para todas las licencias instaladas en este equipo.
                </span>
              </div>
            )}

            {/* Job Selection inside LicenseForm */}
            <div className="flex flex-col gap-2 col-span-2">
              <Label>Trabajo Realizado Asociado (Opcional)</Label>
              <Select value={jobSelection} onValueChange={setJobSelection}>
                <SelectTrigger>
                  <SelectValue>
                    {jobSelection === 'none'
                      ? 'Sin trabajo asociado'
                      : (clientJobs.find(j => j.id.toString() === jobSelection.toString())?.title ?? 'Seleccione trabajo')}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin trabajo asociado</SelectItem>
                  {clientJobs.map((j) => (
                    <SelectItem key={j.id} value={j.id.toString()}>{j.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        <div className="flex flex-col gap-2 col-span-2">
          <Label>Cuánto pagó por esta licencia individual (CLP - Opcional)</Label>
          <Input type="number" value={pricePaid} onChange={(e) => setPricePaid(e.target.value)} placeholder="Ej: 15000" />
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

        {/* Notas específicas de Instalación */}
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

export function SoftwareClient({ 
  initialLicenses, 
  categories,
  clients = [],
  equipment = [],
  jobs = []
}: { 
  initialLicenses: SoftwareLicense[]; 
  categories: Category[];
  clients?: Client[];
  equipment?: Equipment[];
  jobs?: Job[];
}) {
  const [licenses, setLicenses] = useState(initialLicenses)
  
  // Search & filter states
  const [search, setSearch] = useState('')
  const [filterClient, setFilterClient] = useState('all')
  const [filterEquipment, setFilterEquipment] = useState('all')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [filterType, setFilterType] = useState('all')
  
  const [isOpen, setIsOpen] = useState(false)
  const [editLicense, setEditLicense] = useState<SoftwareLicense | undefined>()
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({})
  const [isPending, startTransition] = useTransition()

  // Sync state with incoming server props
  useEffect(() => {
    setLicenses(initialLicenses)
  }, [initialLicenses])

  // Reset equipment filter when client filter changes
  useEffect(() => {
    setFilterEquipment('all')
  }, [filterClient])

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]))

  const filtered = licenses.filter((l) => {
    const matchSearch = l.softwareName.toLowerCase().includes(search.toLowerCase()) ||
      (l.serialKey ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (l.version ?? '').toLowerCase().includes(search.toLowerCase())
    
    const matchType = filterType === 'all' || l.licenseType === filterType
    
    // Loose comparison for robustness
    const matchClient = filterClient === 'all' || 
      (filterClient === 'no-client' && !l.clientId && !l.clientName) ||
      (l.clientId?.toString() === filterClient) ||
      (l.clientName && clients.find(c => c.id.toString() === filterClient)?.name.toLowerCase() === l.clientName.toLowerCase())
      
    const matchEquip = filterEquipment === 'all' ||
      (filterEquipment === 'no-equipment' && !l.equipmentId) ||
      (l.equipmentId?.toString() === filterEquipment)

    const purchaseDateStr = l.purchaseDate ? getIsoDateString(l.purchaseDate) : null
    const matchDateFrom = !filterDateFrom || (purchaseDateStr && purchaseDateStr >= filterDateFrom)
    const matchDateTo = !filterDateTo || (purchaseDateStr && purchaseDateStr <= filterDateTo)
    
    return matchSearch && matchType && matchClient && matchEquip && !!matchDateFrom && !!matchDateTo
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
      const clientObj = lic.clientId ? clients.find(c => c.id.toString() === lic.clientId.toString()) : null;
      const equipObj = lic.equipmentId ? equipment.find(e => e.id.toString() === lic.equipmentId.toString()) : null;
      const jobObj = lic.jobId ? jobs.find(j => j.id.toString() === lic.jobId.toString()) : null;
      fullTxt += exportLicenseToTxt(lic, cat?.name, clientObj, equipObj, jobObj);
      fullTxt += `\n`;
    });
    
    downloadTxtFile(`licencias-filtradas-${new Date().toISOString().slice(0, 10)}.txt`, fullTxt);
  }

  const handleExportSingle = (lic: SoftwareLicense) => {
    const cat = lic.categoryId ? catMap[lic.categoryId] : null;
    const clientObj = lic.clientId ? clients.find(c => c.id.toString() === lic.clientId.toString()) : null;
    const equipObj = lic.equipmentId ? equipment.find(e => e.id.toString() === lic.equipmentId.toString()) : null;
    const jobObj = lic.jobId ? jobs.find(j => j.id.toString() === lic.jobId.toString()) : null;
    const txt = exportLicenseToTxt(lic, cat?.name, clientObj, equipObj, jobObj);
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
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 bg-card border border-border p-4 rounded-xl shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar software, serial..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        
        <Select value={filterClient} onValueChange={setFilterClient}>
          <SelectTrigger className="w-full">
            <SelectValue>
              {filterClient === 'all' 
                ? 'Todos los clientes' 
                : filterClient === 'no-client' 
                  ? 'Sin cliente' 
                  : (clients.find(c => c.id.toString() === filterClient)?.name ?? 'Filtrar por cliente')}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los clientes</SelectItem>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
            ))}
            <SelectItem value="no-client">Sin cliente</SelectItem>
          </SelectContent>
        </Select>

        <Select 
          value={filterEquipment} 
          onValueChange={setFilterEquipment} 
          disabled={filterClient === 'all' || filterClient === 'no-client'}
        >
          <SelectTrigger className="w-full">
            <SelectValue>
              {filterClient === 'all' || filterClient === 'no-client'
                ? 'Seleccione cliente'
                : filterEquipment === 'all'
                  ? 'Todos los equipos'
                  : filterEquipment === 'no-equipment'
                    ? 'Sin equipo'
                    : (equipment.find(e => e.id.toString() === filterEquipment)?.name ?? 'Filtrar por equipo')}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los equipos</SelectItem>
            {equipment
              .filter((e) => e.clientId?.toString() === filterClient)
              .map((e) => (
                <SelectItem key={e.id} value={e.id.toString()}>{e.name}</SelectItem>
              ))}
            <SelectItem value="no-equipment">Sin equipo</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full">
            <SelectValue>
              {filterType === 'all'
                ? 'Todos los tipos'
                : (LICENSE_TYPES.find(t => t.value === filterType)?.label ?? 'Tipo Licencia')}
            </SelectValue>
          </SelectTrigger>
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
                      {(lic.purchasePlace || lic.purchaseUrl || lic.purchaseUser || lic.purchasePassword) && (
                        <div className="bg-secondary/40 p-2.5 rounded-lg border border-border/50">
                          <p className="font-semibold text-primary mb-1.5 flex items-center gap-1.5">
                            <Lock className="h-3.5 w-3.5" /> Portal de Compra
                          </p>
                          <div className="space-y-1">
                            {lic.purchasePlace && (
                              <p>
                                <span className="text-muted-foreground">Lugar:</span>{' '}
                                {lic.purchaseUrl ? (
                                  <a href={lic.purchaseUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline inline-flex items-center gap-0.5">
                                    {lic.purchasePlace} <ExternalLink className="h-3 w-3" />
                                  </a>
                                ) : (
                                  lic.purchasePlace
                                )}
                              </p>
                            )}
                            {lic.purchaseUrl && !lic.purchasePlace && (
                              <p className="flex items-center gap-1">
                                <span className="text-muted-foreground">Portal:</span>{' '}
                                <a href={lic.purchaseUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate max-w-[120px] inline-block">
                                  {lic.purchaseUrl}
                                </a>
                                <CopyButton text={lic.purchaseUrl} title="Copiar URL del portal" />
                              </p>
                            )}
                            {lic.purchasePlace && lic.purchaseUrl && (
                              <p className="flex items-center gap-1">
                                <span className="text-muted-foreground font-semibold">URL:</span>{' '}
                                <a href={lic.purchaseUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate max-w-[120px] inline-block">
                                  Ir al portal
                                </a>
                                <CopyButton text={lic.purchaseUrl} title="Copiar URL del portal" />
                              </p>
                            )}
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
                      {(lic.clientName || lic.clientPhone || lic.clientId || lic.equipmentId || lic.pricePaid || lic.jobId) && (
                        <div className="bg-secondary/40 p-2.5 rounded-lg border border-border/50 col-span-1 md:col-span-2 lg:col-span-1">
                          <p className="font-semibold text-primary mb-1.5 flex items-center gap-1.5">
                            <UserPlus className="h-3.5 w-3.5" /> Instalación & Cliente
                          </p>
                          <div className="space-y-1">
                            {(() => {
                              const associatedClient = lic.clientId ? clients.find(c => c.id.toString() === lic.clientId.toString()) : null
                              const dispName = associatedClient?.name || lic.clientName
                              const dispPhone = associatedClient?.phone || lic.clientPhone
                              const associatedEquip = lic.equipmentId ? equipment.find(e => e.id.toString() === lic.equipmentId.toString()) : null
                              const associatedJob = lic.jobId ? jobs.find(j => j.id.toString() === lic.jobId.toString()) : null

                              return (
                                <>
                                  {dispName && (
                                    <p>
                                      <span className="text-muted-foreground">Cliente:</span>{' '}
                                      <span 
                                        className="font-medium cursor-pointer text-primary hover:underline"
                                        onClick={() => setFilterClient(lic.clientId?.toString() || 'all')}
                                        title="Filtrar por este cliente"
                                      >
                                        {dispName}
                                      </span>
                                    </p>
                                  )}
                                  {dispPhone && <p><span className="text-muted-foreground">Teléfono:</span> {dispPhone}</p>}
                                  {associatedEquip && (
                                    <>
                                      <p>
                                        <span className="text-muted-foreground">Equipo:</span>{' '}
                                        <span className="font-medium text-foreground flex items-center gap-1 mt-0.5">
                                          <Laptop className="h-3 w-3 text-muted-foreground" /> {associatedEquip.name}
                                        </span>
                                      </p>
                                      {associatedEquip.pricePaid && (
                                        <p>
                                          <span className="text-muted-foreground font-semibold">Cobro Equipo:</span>{' '}
                                          <span className="font-semibold text-emerald-500">
                                            {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(associatedEquip.pricePaid)}
                                          </span>
                                        </p>
                                      )}
                                    </>
                                  )}
                                  {associatedJob && (
                                    <p>
                                      <span className="text-muted-foreground">Trabajo:</span>{' '}
                                      <span className="font-medium text-foreground flex items-center gap-1 mt-0.5">
                                        <Briefcase className="h-3 w-3 text-muted-foreground" /> {associatedJob.title}
                                      </span>
                                    </p>
                                  )}
                                </>
                              )
                            })()}
                            {lic.pricePaid && (
                              <p>
                                <span className="text-muted-foreground">Cobro Licencia:</span>{' '}
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
          <LicenseForm 
            license={editLicense} 
            categories={categories} 
            clients={clients}
            equipment={equipment}
            jobs={jobs}
            onClose={() => { setIsOpen(false); setEditLicense(undefined) }} 
          />
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
