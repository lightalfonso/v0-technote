import { getSoftwareLicenses } from '@/app/actions/software'
import { getCategories } from '@/app/actions/categories'
import { SoftwareClient } from '@/components/software-client'

export default async function SoftwarePage() {
  const [licenses, categories] = await Promise.all([getSoftwareLicenses(), getCategories()])
  return <SoftwareClient initialLicenses={licenses} categories={categories} />
}
