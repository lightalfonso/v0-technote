import { getAgendaEvents } from '@/app/actions/agenda'
import { getCategories } from '@/app/actions/categories'
import { AgendaClient } from '@/components/agenda-client'

export default async function AgendaPage() {
  const [events, categories] = await Promise.all([getAgendaEvents(), getCategories()])
  return <AgendaClient initialEvents={events} categories={categories} />
}
