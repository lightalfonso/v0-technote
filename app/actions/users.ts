'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  user,
  session as sessionTable,
  account,
  clients,
  jobs,
  categories,
  notes,
  agendaEvents,
  softwareLicenses,
  equipment
} from '@/lib/db/schema'
import { and, desc, eq, ne } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

const ADMIN_EMAIL = 'alfonso@latenciacero.cl'

async function checkAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    throw new Error('No autorizado')
  }
  if (session.user.email.toLowerCase() !== ADMIN_EMAIL) {
    throw new Error('No autorizado. Se requieren privilegios de administrador.')
  }
  return session.user
}

export async function getUsers() {
  await checkAdmin()
  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(desc(user.createdAt))
}

export async function updateUser(
  id: string,
  data: { name: string; email: string }
) {
  const adminUser = await checkAdmin()
  
  // Find current user being edited
  const currentUserList = await db.select().from(user).where(eq(user.id, id)).limit(1)
  if (currentUserList.length === 0) {
    throw new Error('Usuario no encontrado')
  }
  const currentUser = currentUserList[0]

  // Protect root admin email changes
  if (currentUser.email.toLowerCase() === ADMIN_EMAIL) {
    if (data.email.toLowerCase() !== ADMIN_EMAIL) {
      throw new Error('No se permite cambiar el correo del administrador principal.')
    }
  }

  // Update user info
  await db
    .update(user)
    .set({
      name: data.name,
      email: data.email.toLowerCase(),
      updatedAt: new Date(),
    })
    .where(eq(user.id, id))

  revalidatePath('/dashboard/usuarios')
}

export async function deleteUser(id: string) {
  const adminUser = await checkAdmin()

  // Find user to delete
  const targetUserList = await db.select().from(user).where(eq(user.id, id)).limit(1)
  if (targetUserList.length === 0) {
    throw new Error('Usuario no encontrado')
  }
  const targetUser = targetUserList[0]

  // Prevent self-deletion of root admin
  if (targetUser.email.toLowerCase() === ADMIN_EMAIL) {
    throw new Error('No se puede eliminar la cuenta del administrador principal.')
  }

  // Prevent self-deletion of current logged-in user (just in case they are different)
  if (adminUser.id === id) {
    throw new Error('No puedes eliminar tu propia cuenta mientras estás logueado.')
  }

  // DB Transaction for cascade deletion of all user data
  await db.transaction(async (tx) => {
    // Delete from agenda events
    await tx.delete(agendaEvents).where(eq(agendaEvents.userId, id))

    // Delete from notes
    await tx.delete(notes).where(eq(notes.userId, id))

    // Delete from software licenses
    await tx.delete(softwareLicenses).where(eq(softwareLicenses.userId, id))

    // Delete from jobs (jobEquipment will be cascade deleted automatically by foreign keys to jobs)
    await tx.delete(jobs).where(eq(jobs.userId, id))

    // Delete from equipment
    await tx.delete(equipment).where(eq(equipment.userId, id))

    // Delete from categories
    await tx.delete(categories).where(eq(categories.userId, id))

    // Delete from clients
    await tx.delete(clients).where(eq(clients.userId, id))

    // Delete from account and session (drizzle schemas should handle it or we can delete manually)
    await tx.delete(account).where(eq(account.userId, id))
    await tx.delete(sessionTable).where(eq(sessionTable.userId, id))

    // Finally, delete the user record
    await tx.delete(user).where(eq(user.id, id))
  })

  revalidatePath('/dashboard/usuarios')
}
