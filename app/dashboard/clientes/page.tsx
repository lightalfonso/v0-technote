import { getClients } from '@/app/actions/clients'
import { ClientsClient } from '@/components/clients-client'

export default async function ClientesPage() {
  const clientsList = await getClients()
  return <ClientsClient initialClients={clientsList} />
}
