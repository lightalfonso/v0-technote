'use server'

import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { ilike } from 'drizzle-orm'

export async function getEmailByName(name: string): Promise<string | null> {
  try {
    const result = await db
      .select({ email: user.email })
      .from(user)
      .where(ilike(user.name, name))
      .limit(1)

    return result[0]?.email || null;
  } catch (error) {
    console.error('Error in getEmailByName:', error);
    return null;
  }
}
