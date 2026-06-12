import { getSoftwareLicenses } from '@/app/actions/software'
import { getCategories } from '@/app/actions/categories'
import { getClients } from '@/app/actions/clients'
import { getEquipment } from '@/app/actions/equipment'
import { SoftwareClient } from '@/components/software-client'

export default async function SoftwarePage() {
  const [licenses, categories, clientsList, equipmentList] = await Promise.all([
    getSoftwareLicenses(),
    getCategories(),
    getClients(),
    getEquipment()
  ])
  return (
    <SoftwareClient
      initialLicenses={licenses}
      categories={categories}
      clients={clientsList}
      equipment={equipmentList}
    />
  )
}
