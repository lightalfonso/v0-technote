'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { agendaEvents } from '@/lib/db/schema'
import { and, asc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('No autorizado')
  return session.user.id
}

export async function getAgendaEvents() {
  const userId = await getUserId()
  return db.select().from(agendaEvents).where(eq(agendaEvents.userId, userId)).orderBy(asc(agendaEvents.eventDate))
}

export async function createAgendaEvent(data: {
  title: string
  description?: string
  eventDate: string
  endDate?: string
  categoryId?: number | null
  location?: string
}) {
  const userId = await getUserId()
  await db.insert(agendaEvents).values({
    userId,
    title: data.title,
    description: data.description ?? null,
    eventDate: new Date(data.eventDate),
    endDate: data.endDate ? new Date(data.endDate) : null,
    categoryId: data.categoryId ?? null,
    location: data.location ?? null,
  })
  revalidatePath('/dashboard/agenda')
}

export async function toggleEventComplete(id: number, isCompleted: boolean) {
  const userId = await getUserId()
  await db
    .update(agendaEvents)
    .set({ isCompleted, updatedAt: new Date() })
    .where(and(eq(agendaEvents.id, id), eq(agendaEvents.userId, userId)))
  revalidatePath('/dashboard/agenda')
}

export async function updateAgendaEvent(
  id: number,
  data: {
    title?: string
    description?: string
    eventDate?: string
    endDate?: string
    categoryId?: number | null
    location?: string
  }
) {
  const userId = await getUserId()
  await db
    .update(agendaEvents)
    .set({
      ...data,
      eventDate: data.eventDate ? new Date(data.eventDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      updatedAt: new Date(),
    })
    .where(and(eq(agendaEvents.id, id), eq(agendaEvents.userId, userId)))
  revalidatePath('/dashboard/agenda')
}

export async function deleteAgendaEvent(id: number) {
  const userId = await getUserId()
  await db.delete(agendaEvents).where(and(eq(agendaEvents.id, id), eq(agendaEvents.userId, userId)))
  revalidatePath('/dashboard/agenda')
}
