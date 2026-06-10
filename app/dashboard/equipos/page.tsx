import { getEquipment } from '@/app/actions/equipment'
import { getCategories } from '@/app/actions/categories'
import { EquipmentClient } from '@/components/equipment-client'

export default async function EquiposPage() {
  const [equipmentList, categories] = await Promise.all([getEquipment(), getCategories()])
  return <EquipmentClient initialEquipment={equipmentList} categories={categories} />
}
