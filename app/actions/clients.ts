'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { clients } from '@/lib/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('No autorizado')
  return session.user.id
}

export async function getClients() {
  const userId = await getUserId()
  return db.select().from(clients).where(eq(clients.userId, userId)).orderBy(desc(clients.createdAt))
}

export async function createClient(data: { name: string; phone?: string }) {
  const userId = await getUserId()
  const result = await db.insert(clients).values({
    userId,
    name: data.name,
    phone: data.phone ?? null,
  }).returning({ id: clients.id })
  
  revalidatePath('/dashboard/software')
  revalidatePath('/dashboard/equipos')
  return result[0];
}

export async function updateClient(
  id: number,
  data: Partial<{ name: string; phone: string }>
) {
  const userId = await getUserId()
  await db
    .update(clients)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(clients.id, id), eq(clients.userId, userId)))
  
  revalidatePath('/dashboard/software')
  revalidatePath('/dashboard/equipos')
}

export async function deleteClient(id: number) {
  const userId = await getUserId()
  await db.delete(clients).where(and(eq(clients.id, id), eq(clients.userId, userId)))
  
  revalidatePath('/dashboard/software')
  revalidatePath('/dashboard/equipos')
}
