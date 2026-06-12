'use client'

import { useState, useTransition, useEffect, useMemo } from 'react'
import { createJob, updateJob, deleteJob } from '@/app/actions/jobs'
import { createClient } from '@/app/actions/clients'
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
  Wrench, 
  ExternalLink, 
  Download, 
  Calendar,
  Lock,
  Phone,
  Laptop,
  Briefcase,
  AlertCircle,
  Clock,
  ShieldCheck,
  FileText,
  UserPlus
} from 'lucide-react'
import type { SoftwareLicense, Client, Equipment, Job } from '@/lib/db/schema'

interface ExtendedJob extends Job {
  client: Client | null
  equipments: Equipment[]
  licenses: SoftwareLicense[]
}

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

function WarrantyCountdown({ dateStr, duration }: { dateStr: string | Date | null, duration?: string | null }) {
  const days = daysUntilExpiry(dateStr)
  const durationLabel = duration ? `${duration} ` : ''
  if (days === null) return <Badge variant="outline" className="text-xs">Sin garantía</Badge>
  if (days < 0) return <Badge variant="destructive" className="text-xs">Garantía expirada ({formatLocalDate(dateStr)})</Badge>
  if (days === 0) return <Badge variant="destructive" className="text-xs">Vence hoy</Badge>
  if (days <= 14) return <Badge variant="destructive" className="text-xs">{durationLabel}(Quedan {days}d)</Badge>
  if (days <= 60) return <Badge className="text-xs bg-amber-500 hover:bg-amber-500">{durationLabel}(Quedan {days}d)</Badge>
  return <Badge className="text-xs bg-emerald-500 hover:bg-emerald-600 border-0">{durationLabel}(Quedan {days}d)</Badge>
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

function exportJobToTxt(job: ExtendedJob) {
  let txt = `==================================================\n`;
  txt += `   REPORTE DE TRABAJO REALIZADO\n`;
  txt += `==================================================\n`;
  txt += `Título: ${job.title}\n`;
  txt += `Fecha: ${formatLocalDate(job.jobDate)}\n`;
  if (job.client) {
    txt += `Cliente: ${job.client.name}\n`;
    if (job.client.phone) txt += `Teléfono: ${job.client.phone}\n`;
  }
  if (job.pricePaid) {
    txt += `Monto Cobrado: CLP ${new Intl.NumberFormat('es-CL').format(job.pricePaid)}\n`;
  }
  
  if (job.warrantyExpiry) {
    const days = daysUntilExpiry(job.warrantyExpiry)
    let statusStr = ''
    if (days === null) statusStr = 'Sin garantía'
    else if (days < 0) statusStr = `Expirada el ${formatLocalDate(job.warrantyExpiry)}`
    else if (days === 0) statusStr = 'Vence hoy'
    else statusStr = `Vence el ${formatLocalDate(job.warrantyExpiry)} (Quedan ${days} días)`
    
    txt += `Garantía: ${job.warrantyDuration || 'N/A'} - ${statusStr}\n`;
  }

  if (job.description) txt += `Trabajo Realizado: ${job.description}\n`;
  if (job.workNotes) txt += `Notas de Trabajo: ${job.workNotes}\n`;
  if (job.problemsFound) txt += `Problemas Encontrados: ${job.problemsFound}\n`;
  if (job.problemsSolved) txt += `Problemas Solucionados: ${job.problemsSolved}\n`;
  if (job.recommendations) txt += `Recomendaciones: ${job.recommendations}\n`;

  if (job.equipments.length > 0) {
    txt += `\nEQUIPOS TRABAJADOS:\n`;
    job.equipments.forEach((e, idx) => {
      txt += `  ${idx + 1}. ${e.name} ${e.brand || e.model ? `(${[e.brand, e.model].filter(Boolean).join(' ')})` : ''}\n`;
      if (e.serialNumber) txt += `     S/N: ${e.serialNumber}\n`;
      if (e.specs) txt += `     Specs: ${e.specs}\n`;
    });
  }

  if (job.licenses.length > 0) {
    txt += `\nLICENCIAS INSTALADAS / SERIALES:\n`;
    job.licenses.forEach((l, idx) => {
      txt += `  ${idx + 1}. ${l.softwareName} ${l.version ? `(${l.version})` : ''}\n`;
      if (l.serialKey) txt += `     Serial: ${l.serialKey}\n`;
      if (l.activationType) txt += `     Activación: ${l.activationType}\n`;
    });
  }
  
  txt += `==================================================\n`;
  return txt;
}

function JobForm({ 
  job, 
  clients, 
  equipment, 
  licenses, 
  onClose 
}: { 
  job?: ExtendedJob
  clients: Client[]
  equipment: Equipment[]
  licenses: SoftwareLicense[]
  onClose: () => void 
}) {
  const [jobDate, setJobDate] = useState(job ? getIsoDateString(job.jobDate) : getIsoDateString(new Date()))
  const [title, setTitle] = useState(job?.title ?? '')
  const [description, setDescription] = useState(job?.description ?? '')
  const [workNotes, setWorkNotes] = useState(job?.workNotes ?? '')
  const [problemsFound, setProblemsFound] = useState(job?.problemsFound ?? '')
  const [problemsSolved, setProblemsSolved] = useState(job?.problemsSolved ?? '')
  const [recommendations, setRecommendations] = useState(job?.recommendations ?? '')
  const [warrantyDuration, setWarrantyDuration] = useState(job?.warrantyDuration ?? '')
  const [warrantyExpiry, setWarrantyExpiry] = useState(job ? getIsoDateString(job.warrantyExpiry) : '')
  const [pricePaid, setPricePaid] = useState(job?.pricePaid?.toString() ?? '')
  
  // Client selection
  const [clientSelection, setClientSelection] = useState<string>(
    job?.clientId?.toString() ?? 'none'
  )
  const [newClientName, setNewClientName] = useState('')
  const [newClientPhone, setNewClientPhone] = useState('')

  // Equipment selection (multiple checklist)
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<number[]>(
    job?.equipments.map(e => e.id) ?? []
  )

  // Licenses selection (multiple checklist)
  const [selectedLicenseIds, setSelectedLicenseIds] = useState<number[]>(
    job?.licenses.map(l => l.id) ?? []
  )

  const [isPending, startTransition] = useTransition()

  // Generate title automatically when date changes
  useEffect(() => {
    if (jobDate && !job) {
      const parts = jobDate.split('-')
      if (parts.length === 3) {
        setTitle(`Trabajo de día ${parts[2]}/${parts[1]}/${parts[0]}`)
      }
    }
  }, [jobDate, job])

  // Filter equipment related to selected client (loose comparison)
  const clientEquipment = useMemo(() => {
    if (clientSelection === 'none' || clientSelection === 'new') return []
    const cidStr = clientSelection.toString()
    return equipment.filter(e => e.clientId?.toString() === cidStr)
  }, [equipment, clientSelection])

  // Filter licenses (show unlinked licenses + licenses already linked to this job)
  const availableLicenses = useMemo(() => {
    if (clientSelection === 'none' || clientSelection === 'new') return []
    const cidStr = clientSelection.toString()
    return licenses.filter(l => 
      l.clientId?.toString() === cidStr && 
      (!l.jobId || (job && l.jobId === job.id))
    )
  }, [licenses, clientSelection, job])

  // Reset selected equipment/licenses when client changes
  useEffect(() => {
    if (!job || clientSelection.toString() !== job.clientId?.toString()) {
      setSelectedEquipmentIds([])
      setSelectedLicenseIds([])
    } else {
      setSelectedEquipmentIds(job.equipments.map(e => e.id))
      setSelectedLicenseIds(job.licenses.map(l => l.id))
    }
  }, [clientSelection, job])

  const toggleEquipment = (id: number) => {
    setSelectedEquipmentIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const toggleLicense = (id: number) => {
    setSelectedLicenseIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      let finalClientId: number | null = null

      // 1. Handle Client creation if new
      if (clientSelection === 'new') {
        if (!newClientName.trim()) return
        const createdClient = await createClient({
          name: newClientName.trim(),
          phone: newClientPhone.trim() || undefined,
        })
        if (createdClient?.id) {
          finalClientId = createdClient.id
        }
      } else if (clientSelection !== 'none') {
        finalClientId = parseInt(clientSelection)
      }

      if (!finalClientId) return // Client is required

      const data = {
        clientId: finalClientId,
        jobDate,
        title,
        description: description || undefined,
        workNotes: workNotes || undefined,
        problemsFound: problemsFound || undefined,
        problemsSolved: problemsSolved || undefined,
        recommendations: recommendations || undefined,
        warrantyDuration: warrantyDuration || undefined,
        warrantyExpiry: warrantyExpiry || undefined,
        pricePaid: pricePaid ? parseInt(pricePaid) : undefined,
        equipmentIds: selectedEquipmentIds,
        licenseIds: selectedLicenseIds,
      }

      if (job) {
        await updateJob(job.id, data)
      } else {
        await createJob(data)
      }
      onClose()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2 col-span-2">
          <Label>Seleccionar Cliente</Label>
          <Select value={clientSelection} onValueChange={setClientSelection}>
            <SelectTrigger>
              <SelectValue>
                {clientSelection === 'none'
                  ? 'Seleccione un cliente'
                  : clientSelection === 'new'
                    ? '➕ Crear nuevo cliente...'
                    : (clients.find(c => c.id.toString() === clientSelection.toString())?.name ?? 'Seleccione cliente')}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Seleccione un cliente...</SelectItem>
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
          <>
            <div className="flex flex-col gap-2">
              <Label>Nombre del cliente nuevo</Label>
              <Input 
                value={newClientName} 
                onChange={(e) => setNewClientName(e.target.value)} 
                placeholder="Nombre del cliente" 
                required={clientSelection === 'new'}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Teléfono del cliente nuevo</Label>
              <Input 
                value={newClientPhone} 
                onChange={(e) => setNewClientPhone(e.target.value)} 
                placeholder="Ej: +56 9 1234 5678" 
              />
            </div>
          </>
        )}

        <div className="flex flex-col gap-2">
          <Label>Fecha del trabajo</Label>
          <Input type="date" value={jobDate} onChange={(e) => setJobDate(e.target.value)} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Título del trabajo</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Ej: Trabajo de día 11/06/2026" />
        </div>

        {clientSelection !== 'none' && clientSelection !== 'new' && (
          <>
            {/* Equipments checklist */}
            <div className="flex flex-col gap-2 col-span-2 border border-border rounded-lg p-3 bg-secondary/10">
              <Label className="font-semibold mb-1">Equipos en los que se trabajó</Label>
              {clientEquipment.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No hay equipos registrados para este cliente. Agrégalos en el módulo de Equipos.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[120px] overflow-y-auto pr-1">
                  {clientEquipment.map((e) => (
                    <label key={e.id} className="flex items-center gap-2 text-xs font-normal cursor-pointer hover:bg-muted p-1 rounded">
                      <input 
                        type="checkbox" 
                        checked={selectedEquipmentIds.includes(e.id)} 
                        onChange={() => toggleEquipment(e.id)}
                        className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                      />
                      <span>{e.name} {e.brand || e.model ? `(${[e.brand, e.model].filter(Boolean).join(' ')})` : ''}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Software licenses checklist */}
            <div className="flex flex-col gap-2 col-span-2 border border-border rounded-lg p-3 bg-secondary/10">
              <Label className="font-semibold mb-1">Licencias de software instaladas</Label>
              {availableLicenses.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No hay licencias sin vincular registradas para este cliente. Agrégalas en Software.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[120px] overflow-y-auto pr-1">
                  {availableLicenses.map((l) => (
                    <label key={l.id} className="flex items-center gap-2 text-xs font-normal cursor-pointer hover:bg-muted p-1 rounded">
                      <input 
                        type="checkbox" 
                        checked={selectedLicenseIds.includes(l.id)} 
                        onChange={() => toggleLicense(l.id)}
                        className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                      />
                      <span>{l.softwareName} {l.version ? `(${l.version})` : ''}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <div className="flex flex-col gap-2 col-span-2">
          <Label>Trabajo realizado (Respaldo, Instalación...)</Label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej: Respaldo de archivos, Instalación de Windows 10 LTSC" />
        </div>

        <div className="flex flex-col gap-2 col-span-2">
          <Label>Notas técnicas de trabajo</Label>
          <Textarea value={workNotes} onChange={(e) => setWorkNotes(e.target.value)} rows={2} placeholder="Detalles o notas sobre el trabajo realizado..." className="resize-none" />
        </div>

        <div className="flex flex-col gap-2 col-span-2 border-t border-border pt-3 mt-1">
          <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Garantía & Cobro</h4>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Tiempo de garantía</Label>
          <Input value={warrantyDuration} onChange={(e) => setWarrantyDuration(e.target.value)} placeholder="Ej: 1 año, 6 meses..." />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Fecha de fin de garantía</Label>
          <Input type="date" value={warrantyExpiry} onChange={(e) => setWarrantyExpiry(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2 col-span-2">
          <Label>Monto cobrado por el trabajo completo (CLP)</Label>
          <Input type="number" value={pricePaid} onChange={(e) => setPricePaid(e.target.value)} placeholder="Ej: 70000" />
        </div>

        <div className="flex flex-col gap-2 col-span-2 border-t border-border pt-3 mt-1">
          <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Diagnóstico Detallado</h4>
        </div>
        <div className="flex flex-col gap-2 col-span-2">
          <Label>Problemas encontrados</Label>
          <Textarea value={problemsFound} onChange={(e) => setProblemsFound(e.target.value)} rows={2} placeholder="Indica fallos o problemas detectados..." className="resize-none" />
        </div>
        <div className="flex flex-col gap-2 col-span-2">
          <Label>Problemas solucionados</Label>
          <Textarea value={problemsSolved} onChange={(e) => setProblemsSolved(e.target.value)} rows={2} placeholder="Fallas corregidas y soluciones aplicadas..." className="resize-none" />
        </div>
        <div className="flex flex-col gap-2 col-span-2">
          <Label>Recomendaciones para el cliente</Label>
          <Textarea value={recommendations} onChange={(e) => setRecommendations(e.target.value)} rows={2} placeholder="Ej: Cambiar pasta térmica en 6 meses..." className="resize-none" />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={isPending}>{isPending ? 'Guardando...' : job ? 'Actualizar' : 'Guardar Trabajo'}</Button>
      </DialogFooter>
    </form>
  )
}

export function JobsClient({ 
  initialJobs, 
  clients, 
  equipment, 
  licenses 
}: { 
  initialJobs: ExtendedJob[]
  clients: Client[]
  equipment: Equipment[]
  licenses: SoftwareLicense[]
}) {
  const [jobsList, setJobsList] = useState(initialJobs)
  
  // Search & filter states
  const [search, setSearch] = useState('')
  const [filterClient, setFilterClient] = useState('all')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [filterWarranty, setFilterWarranty] = useState('all') // all, active, expired
  
  const [isOpen, setIsOpen] = useState(false)
  const [editJob, setEditJob] = useState<ExtendedJob | undefined>()
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  // Sync state with incoming server props
  useEffect(() => {
    setJobsList(initialJobs)
  }, [initialJobs])

  const filtered = jobsList.filter((job) => {
    const matchSearch = job.title.toLowerCase().includes(search.toLowerCase()) ||
      (job.description ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (job.workNotes ?? '').toLowerCase().includes(search.toLowerCase())
    
    // Client filter
    const matchClient = filterClient === 'all' || 
      (job.clientId?.toString() === filterClient)

    // Date range filter
    const jobDateStr = job.jobDate ? getIsoDateString(job.jobDate) : null
    const matchDateFrom = !filterDateFrom || (jobDateStr && jobDateStr >= filterDateFrom)
    const matchDateTo = !filterDateTo || (jobDateStr && jobDateStr <= filterDateTo)

    // Warranty filter
    let matchWarranty = true
    if (filterWarranty !== 'all') {
      const days = daysUntilExpiry(job.warrantyExpiry)
      if (filterWarranty === 'active') {
        matchWarranty = days !== null && days >= 0
      } else if (filterWarranty === 'expired') {
        matchWarranty = days !== null && days < 0
      }
    }
    
    return matchSearch && matchClient && matchWarranty && !!matchDateFrom && !!matchDateTo
  })

  const handleDelete = (id: number) => {
    startTransition(async () => {
      await deleteJob(id)
      setJobsList((prev) => prev.filter((j) => j.id !== id))
      setDeleteId(null)
    })
  }

  const handleExportAll = () => {
    let fullTxt = `==================================================\n`;
    fullTxt += `   REPORTE GLOBAL DE TRABAJOS REALIZADOS\n`;
    fullTxt += `==================================================\n`;
    fullTxt += `Generado el: ${new Date().toLocaleDateString('es-CL')} ${new Date().toLocaleTimeString('es-CL')}\n`;
    fullTxt += `Total trabajos filtrados: ${filtered.length}\n\n`;
    
    filtered.forEach((job) => {
      fullTxt += exportJobToTxt(job);
      fullTxt += `\n`;
    });
    
    downloadTxtFile(`reporte-trabajos-${new Date().toISOString().slice(0, 10)}.txt`, fullTxt);
  }

  const handleExportSingle = (job: ExtendedJob) => {
    const txt = exportJobToTxt(job);
    downloadTxtFile(`trabajo-${job.jobDate.toString().split('T')[0]}-${job.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.txt`, txt);
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Trabajos Realizados</h1>
          <p className="text-sm text-muted-foreground mt-1">{jobsList.length} trabajo{jobsList.length !== 1 ? 's' : ''} registrado{jobsList.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleExportAll} disabled={filtered.length === 0}>
            <Download className="h-4 w-4" /> Exportar Reporte (.txt)
          </Button>
          <Button onClick={() => { setEditJob(undefined); setIsOpen(true) }} className="gap-2">
            <Plus className="h-4 w-4" /> Registrar Trabajo
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-6 bg-card border border-border p-4 rounded-xl shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por título, notas..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        
        <Select value={filterClient} onValueChange={setFilterClient}>
          <SelectTrigger className="w-full">
            <SelectValue>
              {filterClient === 'all' 
                ? 'Todos los clientes' 
                : (clients.find(c => c.id.toString() === filterClient)?.name ?? 'Filtrar por cliente')}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los clientes</SelectItem>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterWarranty} onValueChange={setFilterWarranty}>
          <SelectTrigger className="w-full">
            <SelectValue>
              {filterWarranty === 'all' 
                ? 'Todas las garantías' 
                : filterWarranty === 'active' 
                  ? 'Garantía vigente' 
                  : 'Garantía vencida'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las garantías</SelectItem>
            <SelectItem value="active">Garantía vigente</SelectItem>
            <SelectItem value="expired">Garantía vencida</SelectItem>
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
          <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No hay trabajos registrados que coincidan con los filtros</p>
          <Button variant="outline" className="mt-4" onClick={() => { setEditJob(undefined); setIsOpen(true) }}>
            Registrar primer trabajo
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((job) => {
            return (
              <Card key={job.id} className="p-4 bg-card hover:shadow-md transition-all border-border border">
                <div className="flex items-start gap-4">
                  <div className="bg-muted rounded-lg p-2.5 flex-shrink-0">
                    <Briefcase className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-foreground text-sm">{job.title}</h3>
                      <span className="text-xs text-muted-foreground">({formatLocalDate(job.jobDate)})</span>
                      {job.client && (
                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                          <UserPlus className="h-3 w-3" /> {job.client.name}
                        </Badge>
                      )}
                      {job.pricePaid && (
                        <Badge className="text-xs bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-0 font-medium">
                          Cobrado: {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(job.pricePaid)}
                        </Badge>
                      )}
                      <WarrantyCountdown dateStr={job.warrantyExpiry} duration={job.warrantyDuration} />
                    </div>

                    {job.description && (
                      <p className="text-sm font-medium text-foreground mt-2">{job.description}</p>
                    )}

                    {/* Equipments & Licenses layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                      {/* Equipments worked on */}
                      {job.equipments.length > 0 && (
                        <div className="bg-secondary/20 p-2.5 rounded-lg border border-border/40 text-xs">
                          <p className="font-semibold text-primary mb-1 flex items-center gap-1.5">
                            <Laptop className="h-3.5 w-3.5" /> Equipos Trabajados
                          </p>
                          <ul className="space-y-1 text-muted-foreground">
                            {job.equipments.map(e => (
                              <li key={e.id} className="flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                                <span className="font-medium text-foreground">{e.name}</span>
                                {e.brand || e.model ? `(${[e.brand, e.model].filter(Boolean).join(' ')})` : ''}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Licenses installed */}
                      {job.licenses.length > 0 && (
                        <div className="bg-secondary/20 p-2.5 rounded-lg border border-border/40 text-xs">
                          <p className="font-semibold text-primary mb-1 flex items-center gap-1.5">
                            <Lock className="h-3.5 w-3.5" /> Licencias Instaladas
                          </p>
                          <ul className="space-y-1 text-muted-foreground">
                            {job.licenses.map(l => (
                              <li key={l.id} className="flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                                <span className="font-medium text-foreground">{l.softwareName}</span>
                                {l.version ? `(${l.version})` : ''}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Details and notes */}
                    <div className="mt-3 pt-3 border-t border-border grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                      {job.workNotes && (
                        <div className="bg-secondary/30 p-2.5 rounded-lg border border-border/50">
                          <p className="font-semibold text-muted-foreground mb-1 flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5" /> Notas Técnicas
                          </p>
                          <p className="text-muted-foreground whitespace-pre-wrap">{job.workNotes}</p>
                        </div>
                      )}

                      {(job.problemsFound || job.problemsSolved) && (
                        <div className="bg-secondary/30 p-2.5 rounded-lg border border-border/50 col-span-1">
                          <p className="font-semibold text-muted-foreground mb-1 flex items-center gap-1.5">
                            <AlertCircle className="h-3.5 w-3.5" /> Diagnóstico
                          </p>
                          <div className="space-y-1.5">
                            {job.problemsFound && (
                              <p><span className="text-red-500 font-medium">Falla:</span> {job.problemsFound}</p>
                            )}
                            {job.problemsSolved && (
                              <p><span className="text-emerald-500 font-medium">Solución:</span> {job.problemsSolved}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {job.recommendations && (
                        <div className="bg-secondary/30 p-2.5 rounded-lg border border-border/50">
                          <p className="font-semibold text-muted-foreground mb-1 flex items-center gap-1.5">
                            <ShieldCheck className="h-3.5 w-3.5" /> Recomendaciones
                          </p>
                          <p className="text-muted-foreground whitespace-pre-wrap">{job.recommendations}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleExportSingle(job)} title="Exportar reporte a TXT">
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditJob(job); setIsOpen(true) }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(job.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialog for Create/Edit */}
      <Dialog open={isOpen} onOpenChange={(v) => { if (!v) { setIsOpen(false); setEditJob(undefined) } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editJob ? 'Editar Trabajo Realizado' : 'Registrar Trabajo Realizado'}</DialogTitle>
          </DialogHeader>
          <JobForm 
            job={editJob} 
            clients={clients} 
            equipment={equipment} 
            licenses={licenses} 
            onClose={() => { setIsOpen(false); setEditJob(undefined) }} 
          />
        </DialogContent>
      </Dialog>

      {/* Dialog for Delete */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Eliminar Trabajo</DialogTitle></DialogHeader>
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
