import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest, mockDelay } from '@/lib/api-client'
import { useBusinessScope } from './business'
import { asRecord, isLive, listFrom, str } from './http'
import { queryKeys } from './query-keys'
import { sample } from './sample-data'

/**
 * Service categories, same backend as sink-inventory's Store Management page.
 * The list has no server search or pages (only `type`), so both happen in the page.
 *  GET    category/business/{business_id}/?type=SERVICE&limit=100
 *  POST   category/business/{business_id}/   { name, type: 'SERVICE' }
 *  PATCH  category/{id}/                     { name, type: 'SERVICE' }
 *  DELETE category/{id}/
 */

const TYPE = 'SERVICE'
/** Same as sink's service form. */
const LIST_LIMIT = 100

export type ServiceCategory = { id: string; name: string }

const mapCategory = (value: unknown): ServiceCategory => {
  const record = asRecord(value)
  return { id: str(record.id), name: str(record.name) }
}

const getCategories = async (businessId: string): Promise<ServiceCategory[]> => {
  if (!isLive()) return mockDelay([...sample.categories], 300)
  const response = await apiRequest<unknown>(`category/business/${businessId}/?type=${TYPE}&limit=${LIST_LIMIT}`)
  return listFrom(response, ['data', 'results', 'results.data', 'data.results']).map(mapCategory).filter(category => category.id && category.name)
}

export const useServiceCategories = () => {
  const { scope, enabled } = useBusinessScope()
  return useQuery({ queryKey: [...queryKeys.categories, scope], queryFn: () => getCategories(scope), enabled })
}

const createCategory = async (businessId: string, name: string): Promise<ServiceCategory> => {
  if (!isLive()) {
    const category = { id: `sample-category-${Date.now()}`, name }
    sample.categories = [...sample.categories, category]
    return mockDelay(category, 300)
  }
  const response = asRecord(await apiRequest<unknown>(`category/business/${businessId}/`, { method: 'POST', body: { name, type: TYPE } }))
  const category = mapCategory(response.data ?? response)
  return { id: category.id, name: category.name || name }
}

const updateCategory = async ({ id, name }: ServiceCategory) => {
  if (!isLive()) {
    sample.categories = sample.categories.map(category => (category.id === id ? { ...category, name } : category))
    sample.services = sample.services.map(service => (service.categoryId === id ? { ...service, categoryName: name } : service))
    return mockDelay(null, 300)
  }
  return apiRequest<unknown>(`category/${id}/`, { method: 'PATCH', body: { name, type: TYPE } })
}

const deleteCategory = async (id: string) => {
  if (!isLive()) {
    sample.categories = sample.categories.filter(category => category.id !== id)
    return mockDelay(null, 300)
  }
  return apiRequest<unknown>(`category/${id}/`, { method: 'DELETE' })
}

/** Services show their category's name, so they refresh with it. */
const useInvalidateCategories = () => {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.categories })
    queryClient.invalidateQueries({ queryKey: queryKeys.services })
  }
}

export const useCreateCategory = () => {
  const { scope } = useBusinessScope()
  return useMutation({ mutationFn: (name: string) => createCategory(scope, name), onSuccess: useInvalidateCategories() })
}
export const useUpdateCategory = () => useMutation({ mutationFn: updateCategory, onSuccess: useInvalidateCategories() })
export const useDeleteCategory = () => useMutation({ mutationFn: deleteCategory, onSuccess: useInvalidateCategories() })
