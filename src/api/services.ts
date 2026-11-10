import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest, mockDelay } from '@/lib/api-client'
import { useBusinessScope } from './business'
import { apiFormRequest, asRecord, isLive, listFrom, num, str } from './http'
import { queryKeys } from './query-keys'
import { sample } from './sample-data'

/**
 * Service catalogue, same backend as sink-inventory:
 *  GET    service/business/{business_id}/?page&limit&search  → { total, pages, results | data }
 *  POST   service/business/{business_id}/                    JSON, or multipart when an image is attached
 *  PATCH  service/single_service/{id}/
 *  DELETE service/single_service/{id}/
 * Categories live in ./categories.
 */

/** The only durations the backend accepts. */
export const SERVICE_DURATIONS = [15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 210, 240, 270, 300, 360, 420, 480] as const
export const SERVICES_PAGE_SIZE = 20
/** Enough for the booking pickers, as sink's SERVICES_PAGE_SIZE. */
const ALL_SERVICES_LIMIT = 100

export type Service = {
  id: string
  name: string
  categoryId: string
  categoryName: string
  description: string
  amount: number
  image: string
  duration: number
  isActive: boolean
  assignedStaffIds: string[]
  minDepositPercentage: number | null
  maxCapacity: number
}

export const mapService = (value: unknown): Service => {
  const record = asRecord(value)
  const category = asRecord(record.category)
  return {
    id: str(record.id),
    name: str(record.name),
    categoryId: str(record.category_id) || str(category.id),
    categoryName: str(record.category_name) || str(record.category) || str(category.name),
    description: str(record.description),
    amount: num(record.amount ?? record.selling_price),
    image: str(record.image),
    duration: num(record.duration),
    isActive: record.is_active !== false,
    assignedStaffIds: Array.isArray(record.assigned_staff_ids) ? record.assigned_staff_ids.map(str) : [],
    minDepositPercentage: record.min_deposit_percentage === null || record.min_deposit_percentage === undefined ? null : num(record.min_deposit_percentage),
    maxCapacity: num(record.max_capacity) || 1,
  }
}

export type ServicesResult = { services: Service[]; total: number; pages: number }

const getServices = async (businessId: string, page: number, limit: number): Promise<ServicesResult> => {
  if (!isLive()) {
    const pageItems = sample.services.slice((page - 1) * limit, page * limit)
    return mockDelay({ services: pageItems, total: sample.services.length, pages: Math.max(1, Math.ceil(sample.services.length / limit)) })
  }
  const response = await apiRequest<unknown>(`service/business/${businessId}/?page=${page}&limit=${limit}`)
  const record = asRecord(response)
  const data = asRecord(record.data ?? response)
  const services = listFrom(record.data ?? response, ['results.data', 'results', 'data']).map(mapService)
  const total = num(data.total ?? data.count) || services.length
  return { services, total, pages: num(data.pages) || Math.max(1, Math.ceil(total / limit)) }
}

export const useServices = (page: number, limit = SERVICES_PAGE_SIZE) => {
  const { scope, enabled } = useBusinessScope()
  return useQuery({ queryKey: [...queryKeys.services, scope, page, limit], queryFn: () => getServices(scope, page, limit), enabled, placeholderData: keepPreviousData })
}

/** Every service, for pickers and the storefront preview. */
export const useAllServices = () => useServices(1, ALL_SERVICES_LIMIT)

export type ServiceInput = {
  name: string
  categoryId: string
  description: string
  amount: number
  duration: number
  /** null clears a per-service deposit so it follows the business default. */
  minDepositPercentage: number | null
  maxCapacity: number
  assignedStaffIds: string[]
  /** The backend stores one image per service. */
  imageFile?: File
}

const toBody = (input: ServiceInput) => ({
  name: input.name.trim(),
  category_id: input.categoryId,
  description: input.description.trim(),
  amount: input.amount.toFixed(2),
  duration: input.duration,
  max_capacity: input.maxCapacity,
  assigned_staff_ids: input.assignedStaffIds,
  min_deposit_percentage: input.minDepositPercentage,
})

const toForm = (input: ServiceInput) => {
  const form = new FormData()
  const { assigned_staff_ids: staff, min_deposit_percentage: deposit, ...fields } = toBody(input)
  for (const [key, value] of Object.entries(fields)) form.append(key, String(value))
  staff.forEach(id => form.append('assigned_staff_ids', id))
  if (deposit !== null) form.append('min_deposit_percentage', String(deposit))
  if (input.imageFile) form.append('image', input.imageFile)
  return form
}

const toMockService = (input: ServiceInput, base?: Service): Service => ({
  ...(base ?? { id: `sample-service-${Date.now()}`, isActive: true, image: '' }),
  name: input.name.trim(),
  categoryId: input.categoryId,
  categoryName: sample.categories.find(category => category.id === input.categoryId)?.name ?? '',
  description: input.description.trim(),
  amount: input.amount,
  duration: input.duration,
  minDepositPercentage: input.minDepositPercentage,
  maxCapacity: input.maxCapacity,
  assignedStaffIds: input.assignedStaffIds,
  image: input.imageFile ? URL.createObjectURL(input.imageFile) : base?.image ?? '',
})

const createService = async (businessId: string, input: ServiceInput) => {
  if (!isLive()) {
    sample.services = [...sample.services, toMockService(input)]
    return mockDelay(null, 500)
  }
  const url = `service/business/${businessId}/`
  if (input.imageFile) return apiFormRequest<unknown>(url, 'POST', toForm(input))
  // On create a blank deposit is left out, so the backend applies the business default.
  const { min_deposit_percentage: deposit, ...body } = toBody(input)
  return apiRequest<unknown>(url, { method: 'POST', body: deposit === null ? body : { ...body, min_deposit_percentage: deposit } })
}

const updateService = async ({ id, input }: { id: string; input: ServiceInput }) => {
  if (!isLive()) {
    sample.services = sample.services.map(service => (service.id === id ? toMockService(input, service) : service))
    return mockDelay(null, 500)
  }
  const url = `service/single_service/${id}/`
  if (input.imageFile) return apiFormRequest<unknown>(url, 'PATCH', toForm(input))
  return apiRequest<unknown>(url, { method: 'PATCH', body: toBody(input) })
}

const setServiceActive = ({ id, isActive }: { id: string; isActive: boolean }) => {
  if (!isLive()) {
    sample.services = sample.services.map(service => (service.id === id ? { ...service, isActive } : service))
    return mockDelay(null, 300)
  }
  return apiRequest<unknown>(`service/single_service/${id}/`, { method: 'PATCH', body: { is_active: isActive } })
}

const deleteService = (id: string) => {
  if (!isLive()) {
    sample.services = sample.services.filter(service => service.id !== id)
    return mockDelay(null, 300)
  }
  return apiRequest<unknown>(`service/single_service/${id}/`, { method: 'DELETE' })
}

const useInvalidateServices = () => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.services })
}

export const useCreateService = () => {
  const { scope } = useBusinessScope()
  return useMutation({ mutationFn: (input: ServiceInput) => createService(scope, input), onSuccess: useInvalidateServices() })
}
export const useUpdateService = () => useMutation({ mutationFn: updateService, onSuccess: useInvalidateServices() })
export const useSetServiceActive = () => useMutation({ mutationFn: setServiceActive, onSuccess: useInvalidateServices() })
export const useDeleteService = () => useMutation({ mutationFn: deleteService, onSuccess: useInvalidateServices() })
