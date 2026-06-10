import { getCategories } from '@/app/actions/categories'
import { CategoriesClient } from '@/components/categories-client'

export default async function CategoriasPage() {
  const categories = await getCategories()
  return <CategoriesClient initialCategories={categories} />
}
