import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest, mockDelay } from '@/lib/api-client'
import { useBusinessScope } from './business'
import { apiFormRequest, asRecord, isLive, listFrom, num, str } from './http'
import { queryKeys } from './query-keys'
import { sample } from './sample-data'

/**
 * Service catalogue, same backend as sink-inventory:
 *  GET    service/business/{business_id}/?page&limit&search  → { total, pages, results | data }
 *  POST   service/business/{business_id}/                    JSON, or multipart with repeated `images` (≤5)
 *  PATCH  service/single_service/{id}/                       JSON, or multipart with `images` + repeated `kept_media_ids`
 * Responses carry the gallery as `media: [{ id, file, type: "IMAGE" }]`; older rows only have `image`.
 *  DELETE service/single_service/{id}/
 * Categories live in ./categories.
 */

/** The only durations the backend accepts. */
export const SERVICE_DURATIONS = [15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 210, 240, 270, 300, 360, 420, 480] as const
export const SERVICES_PAGE_SIZE = 20
/** Enough for the booking pickers, as sink's SERVICES_PAGE_SIZE. */
const ALL_SERVICES_LIMIT = 100

/** Gallery limits the backend enforces. */
export const SERVICE_MAX_IMAGES = 5
export const SERVICE_IMAGE_MAX_MB = 10
export const SERVICE_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'] as const

export type ServiceMedia = { id: string; url: string }

export type Service = {
  id: string
  name: string
  categoryId: string
  categoryName: string
  description: string
  amount: number
  /** Cover: the first gallery image, else the legacy single `image`. */
  image: string
  /** Saved gallery images; empty for services that only have the legacy `image`. */
  media: ServiceMedia[]
  duration: number
  isActive: boolean
  assignedStaffIds: string[]
  minDepositPercentage: number | null
  maxCapacity: number
}

const mapMedia = (value: unknown): ServiceMedia[] => (Array.isArray(value) ? value : [])
  .map(asRecord)
  .filter(item => (str(item.type) || 'IMAGE').toUpperCase() === 'IMAGE')
  .map(item => ({ id: str(item.id), url: str(item.file) || str(item.url) }))
  .filter(item => item.id && item.url)

export const mapService = (value: unknown): Service => {
  const record = asRecord(value)
  const category = asRecord(record.category)
  const media = mapMedia(record.media)
  return {
    id: str(record.id),
    name: str(record.name),
    categoryId: str(record.category_id) || str(category.id),
    categoryName: str(record.category_name) || str(record.category) || str(category.name),
    description: str(record.description),
    amount: num(record.amount ?? record.selling_price),
    image: media[0]?.url || str(record.image),
    media,
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
  /** New gallery files, sent as repeated `images`. */
  newImages: File[]
  /**
   * Saved media to keep, sent as repeated `kept_media_ids`. null when the gallery
   * wasn't touched, so the field is left out and the backend keeps everything.
   */
  keptMediaIds: string[] | null
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
  input.newImages.forEach(file => form.append('images', file))
  if (input.keptMediaIds) {
    input.keptMediaIds.forEach(id => form.append('kept_media_ids', id))
    // Every saved image removed: send the field empty so it still reads as "keep none".
    if (input.keptMediaIds.length === 0) form.append('kept_media_ids', '')
  }
  return form
}

const needsForm = (input: ServiceInput) => input.newImages.length > 0 || input.keptMediaIds !== null

const toMockMedia = (input: ServiceInput, base?: Service): ServiceMedia[] => {
  const kept = input.keptMediaIds === null ? base?.media ?? [] : (base?.media ?? []).filter(item => input.keptMediaIds?.includes(item.id))
  const added = input.newImages.map((file, index) => ({ id: `sample-media-${Date.now()}-${index}`, url: URL.createObjectURL(file) }))
  return [...kept, ...added].slice(0, SERVICE_MAX_IMAGES)
}

const toMockService = (input: ServiceInput, base?: Service): Service => {
  const media = toMockMedia(input, base)
  return {
    ...(base ?? { id: `sample-service-${Date.now()}`, isActive: true }),
    name: input.name.trim(),
    categoryId: input.categoryId,
    categoryName: sample.categories.find(category => category.id === input.categoryId)?.name ?? '',
    description: input.description.trim(),
    amount: input.amount,
    duration: input.duration,
    minDepositPercentage: input.minDepositPercentage,
    maxCapacity: input.maxCapacity,
    assignedStaffIds: input.assignedStaffIds,
    media,
    image: media[0]?.url ?? '',
  }
}

const createService = async (businessId: string, input: ServiceInput) => {
  if (!isLive()) {
    sample.services = [...sample.services, toMockService(input)]
    return mockDelay(null, 500)
  }
  const url = `service/business/${businessId}/`
  // New services start switched on, so clients can book them straight away.
  if (input.newImages.length) {
    const form = toForm(input)
    form.append('is_active', 'true')
    return apiFormRequest<unknown>(url, 'POST', form)
  }
  // On create a blank deposit is left out, so the backend applies the business default.
  const { min_deposit_percentage: deposit, ...body } = toBody(input)
  return apiRequest<unknown>(url, { method: 'POST', body: { ...body, is_active: true, ...(deposit === null ? {} : { min_deposit_percentage: deposit }) } })
}

const updateService = async ({ id, input }: { id: string; input: ServiceInput }) => {
  if (!isLive()) {
    sample.services = sample.services.map(service => (service.id === id ? toMockService(input, service) : service))
    return mockDelay(null, 500)
  }
  const url = `service/single_service/${id}/`
  if (needsForm(input)) return apiFormRequest<unknown>(url, 'PATCH', toForm(input))
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
