'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { softwareLicenses } from '@/lib/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('No autorizado')
  return session.user.id
}

export async function getSoftwareLicenses() {
  const userId = await getUserId()
  return db.select().from(softwareLicenses).where(eq(softwareLicenses.userId, userId)).orderBy(desc(softwareLicenses.createdAt))
}

export async function createSoftwareLicense(data: {
  softwareName: string
  version?: string
  serialKey?: string
  licenseType?: string
  purchaseDate?: string
  expiryDate?: string
  maxInstalls?: number
  currentInstalls?: number
  downloadUrl?: string
  notes?: string
  categoryId?: number | null
}) {
  const userId = await getUserId()
  await db.insert(softwareLicenses).values({
    userId,
    softwareName: data.softwareName,
    version: data.version ?? null,
    serialKey: data.serialKey ?? null,
    licenseType: data.licenseType ?? 'perpetual',
    purchaseDate: data.purchaseDate ?? null,
    expiryDate: data.expiryDate ?? null,
    maxInstalls: data.maxInstalls ?? null,
    currentInstalls: data.currentInstalls ?? 0,
    downloadUrl: data.downloadUrl ?? null,
    notes: data.notes ?? null,
    categoryId: data.categoryId ?? null,
  })
  revalidatePath('/dashboard/software')
}

export async function updateSoftwareLicense(
  id: number,
  data: Partial<{
    softwareName: string
    version: string
    serialKey: string
    licenseType: string
    purchaseDate: string
    expiryDate: string
    maxInstalls: number
    currentInstalls: number
    downloadUrl: string
    notes: string
    categoryId: number | null
  }>
) {
  const userId = await getUserId()
  await db
    .update(softwareLicenses)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(softwareLicenses.id, id), eq(softwareLicenses.userId, userId)))
  revalidatePath('/dashboard/software')
}

export async function deleteSoftwareLicense(id: number) {
  const userId = await getUserId()
  await db.delete(softwareLicenses).where(and(eq(softwareLicenses.id, id), eq(softwareLicenses.userId, userId)))
  revalidatePath('/dashboard/software')
}
