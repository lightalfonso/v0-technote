import { getJobs } from '@/app/actions/jobs'
import { getClients } from '@/app/actions/clients'
import { getEquipment } from '@/app/actions/equipment'
import { getSoftwareLicenses } from '@/app/actions/software'
import { JobsClient } from '@/components/jobs-client'

export default async function TrabajosPage() {
  const [jobsList, clientsList, equipmentList, licensesList] = await Promise.all([
    getJobs(),
    getClients(),
    getEquipment(),
    getSoftwareLicenses()
  ])
  
  return (
    <JobsClient 
      initialJobs={jobsList} 
      clients={clientsList} 
      equipment={equipmentList} 
      licenses={licensesList} 
    />
  )
}
