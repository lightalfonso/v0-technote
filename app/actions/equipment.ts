'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { equipment } from '@/lib/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('No autorizado')
  return session.user.id
}

export async function getEquipment() {
  const userId = await getUserId()
  return db.select().from(equipment).where(eq(equipment.userId, userId)).orderBy(desc(equipment.createdAt))
}

export async function createEquipment(data: {
  name: string
  brand?: string
  model?: string
  serialNumber?: string
  categoryId?: number | null
  ownerName?: string
  ownerType?: string
  purchaseDate?: string
  warrantyExpiry?: string
  capacity?: string
  specs?: string
  notes?: string
  status?: string
  lastMaintenance?: string
  clientId?: number | null
}) {
  const userId = await getUserId()
  const result = await db.insert(equipment).values({
    userId,
    name: data.name,
    brand: data.brand ?? null,
    model: data.model ?? null,
    serialNumber: data.serialNumber ?? null,
    categoryId: data.categoryId ?? null,
    ownerName: data.ownerName ?? null,
    ownerType: data.ownerType ?? 'client',
    purchaseDate: data.purchaseDate ?? null,
    warrantyExpiry: data.warrantyExpiry ?? null,
    capacity: data.capacity ?? null,
    specs: data.specs ?? null,
    notes: data.notes ?? null,
    status: data.status ?? 'active',
    lastMaintenance: data.lastMaintenance ?? null,
    clientId: data.clientId ?? null,
  }).returning({ id: equipment.id })
  revalidatePath('/dashboard/equipos')
  return result[0]
}

export async function updateEquipment(
  id: number,
  data: Partial<{
    name: string
    brand: string
    model: string
    serialNumber: string
    categoryId: number | null
    ownerName: string
    ownerType: string
    purchaseDate: string
    warrantyExpiry: string
    capacity: string
    specs: string
    notes: string
    status: string
    lastMaintenance: string
    clientId: number | null
  }>
) {
  const userId = await getUserId()
  await db
    .update(equipment)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(equipment.id, id), eq(equipment.userId, userId)))
  revalidatePath('/dashboard/equipos')
}

export async function deleteEquipment(id: number) {
  const userId = await getUserId()
  await db.delete(equipment).where(and(eq(equipment.id, id), eq(equipment.userId, userId)))
  revalidatePath('/dashboard/equipos')
}
