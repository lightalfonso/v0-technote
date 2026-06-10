'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { categories } from '@/lib/db/schema'
import { and, asc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('No autorizado')
  return session.user.id
}

export async function getCategories() {
  const userId = await getUserId()
  return db.select().from(categories).where(eq(categories.userId, userId)).orderBy(asc(categories.createdAt))
}

export async function createCategory(data: { name: string; color: string }) {
  const userId = await getUserId()
  await db.insert(categories).values({ userId, name: data.name, color: data.color, isDefault: false })
  revalidatePath('/dashboard')
}

export async function deleteCategory(id: number) {
  const userId = await getUserId()
  const cat = await db.select().from(categories).where(and(eq(categories.id, id), eq(categories.userId, userId))).limit(1)
  if (cat[0]?.isDefault) throw new Error('No puedes eliminar categorías predeterminadas')
  await db.delete(categories).where(and(eq(categories.id, id), eq(categories.userId, userId)))
  revalidatePath('/dashboard')
}

export async function ensureDefaultCategories() {
  const userId = await getUserId()
  const existing = await db.select().from(categories).where(and(eq(categories.userId, userId), eq(categories.isDefault, true)))
  if (existing.length === 0) {
    await db.insert(categories).values([
      { userId, name: 'Trabajo', color: '#3b82f6', isDefault: true },
      { userId, name: 'Personal', color: '#10b981', isDefault: true },
      { userId, name: 'Mantención', color: '#f59e0b', isDefault: true },
    ])
  }
  // No revalidatePath here — this is called during layout render
}
