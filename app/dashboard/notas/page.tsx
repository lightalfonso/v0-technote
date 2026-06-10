import { getNotes } from '@/app/actions/notes'
import { getCategories } from '@/app/actions/categories'
import { NotesClient } from '@/components/notes-client'

export default async function NotasPage() {
  const [notes, categories] = await Promise.all([getNotes(), getCategories()])
  return <NotesClient initialNotes={notes} categories={categories} />
}
