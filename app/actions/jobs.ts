'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { jobs, jobEquipment, clients, equipment, softwareLicenses } from '@/lib/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('No autorizado')
  return session.user.id
}

export async function getJobs() {
  const userId = await getUserId()
  
  // 1. Fetch all jobs owned by current user
  const allJobs = await db
    .select()
    .from(jobs)
    .where(eq(jobs.userId, userId))
    .orderBy(desc(jobs.jobDate))
  
  if (allJobs.length === 0) return []
  
  // 2. Fetch related data to avoid expensive joins
  const [clientsList, jobEquipList, allEquipList, allLicList] = await Promise.all([
    db.select().from(clients).where(eq(clients.userId, userId)),
    db.select().from(jobEquipment),
    db.select().from(equipment).where(eq(equipment.userId, userId)),
    db.select().from(softwareLicenses).where(eq(softwareLicenses.userId, userId))
  ])
  
  // 3. Map relationships
  return allJobs.map((job) => {
    const clientObj = clientsList.find(c => c.id === job.clientId)
    
    // Find equipment linked directly
    const mainEquipment = allEquipList.find(e => e.id === job.equipmentId)
    
    // Find equipment linked to this job (fallback many-to-many)
    const linkedEquipIds = jobEquipList.filter(je => je.jobId === job.id).map(je => je.equipmentId)
    const linkedEquipments = allEquipList.filter(e => linkedEquipIds.includes(e.id))
    
    // Find licenses linked to this job
    const linkedLicenses = allLicList.filter(l => l.jobId === job.id)
    
    return {
      ...job,
      client: clientObj ?? null,
      equipment: mainEquipment ?? (linkedEquipments[0] ?? null),
      equipments: mainEquipment ? [mainEquipment] : linkedEquipments,
      licenses: linkedLicenses
    }
  })
}

export async function createJob(data: {
  clientId: number
  equipmentId?: number | null
  jobDate: string
  title: string
  description?: string
  workNotes?: string
  problemsFound?: string
  problemsSolved?: string
  recommendations?: string
  warrantyDuration?: string
  warrantyExpiry?: string
  pricePaid?: number
  equipmentIds: number[]
  licenseIds?: number[]
}) {
  const userId = await getUserId()
  const finalEquipId = data.equipmentId ?? (data.equipmentIds && data.equipmentIds[0]) ?? null
  
  // 1. Insert the job
  const inserted = await db.insert(jobs).values({
    userId,
    clientId: data.clientId,
    equipmentId: finalEquipId,
    jobDate: data.jobDate,
    title: data.title,
    description: data.description ?? null,
    workNotes: data.workNotes ?? null,
    problemsFound: data.problemsFound ?? null,
    problemsSolved: data.problemsSolved ?? null,
    recommendations: data.recommendations ?? null,
    warrantyDuration: data.warrantyDuration ?? null,
    warrantyExpiry: data.warrantyExpiry ?? null,
    pricePaid: data.pricePaid ?? null,
  }).returning({ id: jobs.id })
  
  const jobId = inserted[0].id
  
  // 2. Insert job_equipment relations (for backward compatibility)
  if (finalEquipId) {
    await db.insert(jobEquipment).values({
      jobId,
      equipmentId: finalEquipId
    })
  } else if (data.equipmentIds && data.equipmentIds.length > 0) {
    const valuesToInsert = data.equipmentIds.map(equipId => ({
      jobId,
      equipmentId: equipId
    }))
    await db.insert(jobEquipment).values(valuesToInsert)
  }
  
  // 3. Update software_licenses to link them to this jobId AND equipmentId
  if (data.licenseIds && data.licenseIds.length > 0) {
    for (const licId of data.licenseIds) {
      await db.update(softwareLicenses)
        .set({ 
          jobId, 
          equipmentId: finalEquipId, 
          updatedAt: new Date() 
        })
        .where(eq(softwareLicenses.id, licId))
    }
  }
  
  revalidatePath('/dashboard/trabajos')
  revalidatePath('/dashboard/software')
  revalidatePath('/dashboard/equipos')
}

export async function updateJob(
  id: number,
  data: {
    clientId: number
    equipmentId?: number | null
    jobDate: string
    title: string
    description?: string
    workNotes?: string
    problemsFound?: string
    problemsSolved?: string
    recommendations?: string
    warrantyDuration?: string
    warrantyExpiry?: string
    pricePaid?: number
    equipmentIds: number[]
    licenseIds?: number[]
  }
) {
  const userId = await getUserId()
  const finalEquipId = data.equipmentId ?? (data.equipmentIds && data.equipmentIds[0]) ?? null
  
  // 1. Update job fields
  await db.update(jobs)
    .set({
      clientId: data.clientId,
      equipmentId: finalEquipId,
      jobDate: data.jobDate,
      title: data.title,
      description: data.description ?? null,
      workNotes: data.workNotes ?? null,
      problemsFound: data.problemsFound ?? null,
      problemsSolved: data.problemsSolved ?? null,
      recommendations: data.recommendations ?? null,
      warrantyDuration: data.warrantyDuration ?? null,
      warrantyExpiry: data.warrantyExpiry ?? null,
      pricePaid: data.pricePaid ?? null,
      updatedAt: new Date(),
    })
    .where(and(eq(jobs.id, id), eq(jobs.userId, userId)))
  
  // 2. Update job_equipment relations (delete old, insert new)
  await db.delete(jobEquipment).where(eq(jobEquipment.jobId, id))
  if (finalEquipId) {
    await db.insert(jobEquipment).values({
      jobId: id,
      equipmentId: finalEquipId
    })
  } else if (data.equipmentIds.length > 0) {
    const valuesToInsert = data.equipmentIds.map(equipId => ({
      jobId: id,
      equipmentId: equipId
    }))
    await db.insert(jobEquipment).values(valuesToInsert)
  }
  
  // 3. Update software_licenses (remove old links to this job, set new ones with jobId AND equipmentId)
  await db.update(softwareLicenses)
    .set({ jobId: null, updatedAt: new Date() })
    .where(eq(softwareLicenses.jobId, id))
    
  if (data.licenseIds && data.licenseIds.length > 0) {
    for (const licId of data.licenseIds) {
      await db.update(softwareLicenses)
        .set({ 
          jobId: id, 
          equipmentId: finalEquipId, 
          updatedAt: new Date() 
        })
        .where(eq(softwareLicenses.id, licId))
    }
  }
  
  revalidatePath('/dashboard/trabajos')
  revalidatePath('/dashboard/software')
  revalidatePath('/dashboard/equipos')
}

export async function deleteJob(id: number) {
  const userId = await getUserId()
  
  // Delete the job (cascade will handle job_equipment deletions)
  await db.delete(jobs).where(and(eq(jobs.id, id), eq(jobs.userId, userId)))
  
  revalidatePath('/dashboard/trabajos')
  revalidatePath('/dashboard/software')
  revalidatePath('/dashboard/equipos')
}
