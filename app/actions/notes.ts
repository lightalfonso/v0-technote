'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { notes } from '@/lib/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('No autorizado')
  return session.user.id
}

export async function getNotes() {
  const userId = await getUserId()
  return db.select().from(notes).where(eq(notes.userId, userId)).orderBy(desc(notes.updatedAt))
}

export async function createNote(data: {
  title: string
  content: string
  categoryId?: number | null
  priority?: string
  tags?: string
}) {
  const userId = await getUserId()
  await db.insert(notes).values({
    userId,
    title: data.title,
    content: data.content,
    categoryId: data.categoryId ?? null,
    priority: data.priority ?? 'normal',
    tags: data.tags ?? null,
  })
  revalidatePath('/dashboard/notas')
}

export async function updateNote(
  id: number,
  data: {
    title?: string
    content?: string
    categoryId?: number | null
    priority?: string
    tags?: string
  }
) {
  const userId = await getUserId()
  await db
    .update(notes)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(notes.id, id), eq(notes.userId, userId)))
  revalidatePath('/dashboard/notas')
}

export async function deleteNote(id: number) {
  const userId = await getUserId()
  await db.delete(notes).where(and(eq(notes.id, id), eq(notes.userId, userId)))
  revalidatePath('/dashboard/notas')
}
