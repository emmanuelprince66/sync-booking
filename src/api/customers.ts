import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest, mockDelay } from '@/lib/api-client'
import { useBusinessScope } from './business'
import { asRecord, at, isLive, listFrom, num, str } from './http'
import { queryKeys } from './query-keys'
import { sample } from './sample-data'

/**
 * Clients, same backend as sink-inventory's customers:
 *  GET    customer/{business_id}/?search&status&start_date&end_date&page&limit
 *         → { total, pages, results: { data: Customer[], customer_count, active_customers, new_customers, total_spend, … } }
 *  GET    customer/single/{id}/                      → { identity, customer_journey, purchase_behaviour, engagement_metrics, data: Customer }
 *  POST   customer/{business_id}/                    { name, phone, email?, gender?, date_of_birth?, address? }
 *  PATCH  customer/single/{id}/                      the same, plus birthday; null clears gender and birthday
 *  DELETE customer/single/{id}/
 *  GET    customer/analytics/overview/{business_id}/ → { new_this_month, … }
 */

export const CUSTOMERS_PAGE_SIZE = 20

export type CustomerAddress = { address: string; city: string; state: string; country: string; phone: string; latitude: string; longitude: string; isDefault: boolean }

export type Customer = {
  id: string
  name: string
  email: string
  phone: string
  bookingsCount: number
  totalSpent: number
  gender: string
  /** "YYYY-MM-DD", or "MM-DD" when no year was given. */
  dateOfBirth: string
  /** The default address, or null when none is on file. */
  address: CustomerAddress | null
  /** Human-readable code, e.g. "CUS-466E90" ('' when the API sends none). */
  customerCode: string
  /** "Active" | "At Risk" | "Inactive" ('' when unknown). */
  status: string
  /** Pre-formatted by the API, e.g. "Aug 12, 2026" ('' when never seen). */
  lastVisit: string
}

/** Sink's status filter: every value the list endpoint's `status` param accepts. */
export const CUSTOMER_STATUS_FILTERS = [
  { value: '', label: 'All clients' },
  { value: 'MOST_ACTIVE', label: 'Most active' },
  { value: 'NEW', label: 'New' },
  { value: 'LEAST_ACTIVE', label: 'Least active' },
  { value: 'DEBTS', label: 'Owing' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'AT_RISK', label: 'At risk' },
  { value: 'INACTIVE', label: 'Inactive' },
]

export type CustomersSummary = { customerCount: number; activeCustomers: number; newCustomers: number; totalSpend: number }
export type CustomersResult = { customers: Customer[]; total: number; pages: number; summary: CustomersSummary }
export type CustomersQuery = { page?: number; limit?: number; search?: string; status?: string; startDate?: string; endDate?: string; enabled?: boolean }
export type CustomerInput = {
  name: string
  phone: string
  email?: string
  gender?: string
  dateOfBirth?: string
  address?: CustomerAddress
}

const mapAddress = (value: unknown): CustomerAddress => {
  const record = asRecord(value)
  return { address: str(record.address), city: str(record.city), state: str(record.state), country: str(record.country), phone: str(record.phone), latitude: str(record.latitude), longitude: str(record.longitude), isDefault: record.is_default === true }
}

const mapCustomer = (value: unknown): Customer => {
  const record = asRecord(value)
  const addresses = Array.isArray(record.addresses) ? record.addresses.map(mapAddress) : []
  return {
    id: str(record.id),
    name: str(record.name),
    email: str(record.email),
    phone: str(record.phone),
    bookingsCount: num(record.sales_count),
    totalSpent: num(record.total_spent ?? record.total_sales),
    gender: str(record.gender),
    dateOfBirth: str(record.date_of_birth) || str(record.birthday),
    address: addresses.find(address => address.isDefault) ?? addresses[0] ?? null,
    customerCode: str(record.customer_code),
    status: str(record.status),
    lastVisit: str(record.last_visit),
  }
}

/** Sink's nested address. A phone is only sent when editing; coordinates only when they are known. */
const toAddressBody = (address: CustomerAddress, isEdit: boolean) => ({
  address: address.address,
  city: address.city || undefined,
  state: address.state || undefined,
  country: address.country || 'Nigeria',
  ...(isEdit ? { phone: address.phone || null } : {}),
  is_default: address.isDefault,
  ...(address.latitude && address.longitude ? { latitude: address.latitude, longitude: address.longitude } : {}),
})

const toMockCustomer = (input: CustomerInput) => ({ name: input.name, phone: input.phone, email: input.email ?? '', gender: input.gender ?? '', dateOfBirth: input.dateOfBirth ?? '', address: input.address ?? null })

const mockStatus = (customer: Customer) => (customer.bookingsCount >= 5 ? 'Active' : customer.bookingsCount > 0 ? 'At Risk' : 'Inactive')

const getMockCustomers = (page: number, limit: number, search: string, status: string): Promise<CustomersResult> => {
  const term = search.toLowerCase()
  const byStatus = (customer: Customer) => {
    if (!status) return true
    if (status === 'ACTIVE' || status === 'MOST_ACTIVE') return customer.status === 'Active'
    if (status === 'AT_RISK' || status === 'LEAST_ACTIVE') return customer.status === 'At Risk'
    if (status === 'INACTIVE') return customer.status === 'Inactive'
    if (status === 'NEW') return customer.bookingsCount <= 1
    return false
  }
  const all = sample.customers.map(customer => ({ ...customer, status: customer.status || mockStatus(customer) }))
  const matches = all.filter(customer => byStatus(customer) && (!term || [customer.name, customer.email, customer.phone, customer.phone.replace(/\D/g, '')].some(value => value.toLowerCase().includes(term))))
  if (status === 'MOST_ACTIVE') matches.sort((a, b) => b.bookingsCount - a.bookingsCount)
  if (status === 'LEAST_ACTIVE') matches.sort((a, b) => a.bookingsCount - b.bookingsCount)
  return mockDelay({
    customers: matches.slice((page - 1) * limit, page * limit),
    total: matches.length,
    pages: Math.max(1, Math.ceil(matches.length / limit)),
    summary: { customerCount: all.length, activeCustomers: all.filter(item => item.status === 'Active').length, newCustomers: sample.newClientsThisMonth, totalSpend: all.reduce((sum, item) => sum + item.totalSpent, 0) },
  })
}

const getCustomers = async (businessId: string, { page = 1, limit = CUSTOMERS_PAGE_SIZE, search = '', status = '', startDate = '', endDate = '' }: CustomersQuery): Promise<CustomersResult> => {
  if (!isLive()) return getMockCustomers(page, limit, search, status)
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (search) params.set('search', search)
  if (status) params.set('status', status)
  if (startDate) params.set('start_date', startDate)
  if (endDate) params.set('end_date', endDate)
  const response = await apiRequest<unknown>(`customer/${businessId}/?${params.toString()}`)
  const customers = listFrom(response, ['results.data', 'results', 'data']).map(mapCustomer)
  const stats = asRecord(at(response, 'results'))
  const total = num(at(response, 'total') ?? stats.customer_count) || customers.length
  return {
    customers,
    total,
    pages: num(at(response, 'pages')) || Math.max(1, Math.ceil(total / limit)),
    summary: { customerCount: num(stats.customer_count) || total, activeCustomers: num(stats.active_customers), newCustomers: num(stats.new_customers), totalSpend: num(stats.total_spend) },
  }
}

export const useCustomers = ({ enabled: wanted = true, ...query }: CustomersQuery = {}) => {
  const { scope, enabled } = useBusinessScope()
  const { page = 1, limit = CUSTOMERS_PAGE_SIZE, search = '', status = '', startDate = '', endDate = '' } = query
  return useQuery({
    queryKey: [...queryKeys.customers, scope, page, limit, search, status, startDate, endDate],
    queryFn: () => getCustomers(scope, { page, limit, search, status, startDate, endDate }),
    enabled: enabled && wanted,
    placeholderData: keepPreviousData,
  })
}

const customerFromResponse = (response: unknown, input: CustomerInput): Customer => {
  const record = asRecord(response)
  const data = asRecord(record.data ?? response)
  const inner = asRecord(data.customer)
  const mapped = mapCustomer(inner.id ? inner : data)
  return { ...mapped, name: mapped.name || input.name, phone: mapped.phone || input.phone, email: mapped.email || input.email || '' }
}

const createCustomer = async (businessId: string, input: CustomerInput): Promise<Customer> => {
  if (!isLive()) {
    const customer: Customer = { id: `sample-client-${Date.now()}`, ...toMockCustomer(input), bookingsCount: 0, totalSpent: 0, customerCode: '', status: '', lastVisit: '' }
    sample.customers = [customer, ...sample.customers]
    return mockDelay(customer, 400)
  }
  // Unanswered fields are left out: the serializer rejects "" for a choice field.
  const body = {
    name: input.name,
    phone: input.phone,
    ...(input.email ? { email: input.email } : {}),
    ...(input.gender ? { gender: input.gender } : {}),
    ...(input.dateOfBirth ? { date_of_birth: input.dateOfBirth } : {}),
    ...(input.address ? { address: toAddressBody(input.address, false) } : {}),
  }
  return customerFromResponse(await apiRequest<unknown>(`customer/${businessId}/`, { method: 'POST', body }), input)
}

const updateCustomer = async ({ id, input }: { id: string; input: CustomerInput }) => {
  if (!isLive()) {
    sample.customers = sample.customers.map(customer => (customer.id === id ? { ...customer, ...toMockCustomer(input) } : customer))
    return mockDelay(null, 400)
  }
  return apiRequest<unknown>(`customer/single/${id}/`, { method: 'PATCH', body: {
    name: input.name,
    phone: input.phone,
    email: input.email ?? '',
    gender: input.gender || null,
    date_of_birth: input.dateOfBirth || null,
    birthday: input.dateOfBirth || null,
    ...(input.address ? { address: toAddressBody(input.address, true) } : {}),
  } })
}

const deleteCustomer = async (id: string) => {
  if (!isLive()) {
    sample.customers = sample.customers.filter(customer => customer.id !== id)
    return mockDelay(null, 300)
  }
  return apiRequest<unknown>(`customer/single/${id}/`, { method: 'DELETE' })
}

const useInvalidateCustomers = () => {
  const queryClient = useQueryClient()
  return async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.customers })
    await queryClient.invalidateQueries({ queryKey: queryKeys.customer })
  }
}

export const useCreateCustomer = () => {
  const { scope } = useBusinessScope()
  return useMutation({ mutationFn: (input: CustomerInput) => createCustomer(scope, input), onSuccess: useInvalidateCustomers() })
}
export const useUpdateCustomer = () => useMutation({ mutationFn: updateCustomer, onSuccess: useInvalidateCustomers() })
/** Only the list is refreshed: the deleted client's own page is left as it was, so it never refetches into "not found" on the way out. */
export const useDeleteCustomer = () => {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: deleteCustomer, onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.customers }) })
}

const getNewThisMonth = async (businessId: string) => {
  if (!isLive()) return mockDelay(sample.newClientsThisMonth)
  const response = asRecord(await apiRequest<unknown>(`customer/analytics/overview/${businessId}/`))
  return num(asRecord(response.data ?? response).new_this_month)
}

export const useNewClientsThisMonth = () => {
  const { scope, enabled } = useBusinessScope()
  return useQuery({ queryKey: [...queryKeys.customerOverview, scope], queryFn: () => getNewThisMonth(scope), enabled })
}

// ─── One client (sink's customer profile) ───────────────────────────────────

export type CustomerProfile = {
  customer: Customer
  /** "Aug 2026" (pre-formatted by the API). */
  customerSince: string
  /** ISO dates, '' until the milestone happens. */
  journey: { registered: string; firstPurchase: string; latestPurchase: string }
  totalOrders: number
  totalSpend: number
  averageBasket: number
  lifetimeValue: number
  favouriteService: string
  preferredPayment: string
  /** 0–100. */
  retentionScore: number
  churnRisk: string
}

const mapProfile = (response: unknown, id: string): CustomerProfile | null => {
  const root = asRecord(response)
  const detail = asRecord(root.identity ? root : root.data)
  const identity = asRecord(detail.identity)
  const purchase = asRecord(detail.purchase_behaviour)
  const engagement = asRecord(detail.engagement_metrics)
  const journey = asRecord(detail.customer_journey)
  const row = mapCustomer(detail.data)
  if (!row.id && !str(identity.name)) return null
  const customer: Customer = {
    ...row,
    id: row.id || id,
    name: str(identity.name) || row.name,
    phone: str(identity.phone) || row.phone,
    email: str(identity.email) || row.email,
    gender: str(identity.gender) || row.gender,
    dateOfBirth: str(identity.date_of_birth) || row.dateOfBirth,
    // The nested row's sales_count/total_sales can lag; purchase_behaviour carries the real totals.
    bookingsCount: num(purchase.total_orders) || row.bookingsCount,
    totalSpent: num(purchase.total_spend) || row.totalSpent,
  }
  return {
    customer,
    customerSince: str(identity.customer_since),
    journey: { registered: str(journey.customer_registered), firstPurchase: str(journey.first_purchase), latestPurchase: str(journey.latest_purchase) },
    totalOrders: customer.bookingsCount,
    totalSpend: customer.totalSpent,
    averageBasket: num(purchase.average_basket_size),
    lifetimeValue: num(purchase.lifetime_value),
    favouriteService: str(purchase.favourite_product) || str(purchase.favourite_category),
    preferredPayment: str(purchase.preferred_payment),
    retentionScore: num(purchase.retention_score ?? engagement.retention_score),
    churnRisk: str(engagement.churn_risk) || str(asRecord(detail.data).risk_level),
  }
}

const getMockProfile = (id: string): Promise<CustomerProfile | null> => {
  const customer = sample.customers.find(item => item.id === id)
  if (!customer) return mockDelay(null)
  const bookings = sample.bookings.filter(item => item.customerId === id).sort((a, b) => a.date.localeCompare(b.date))
  return mockDelay({
    customer: { ...customer, status: customer.status || mockStatus(customer) },
    customerSince: 'Jan 2026',
    journey: { registered: '2026-01-14', firstPurchase: bookings[0]?.date ?? '', latestPurchase: bookings.at(-1)?.date ?? '' },
    totalOrders: customer.bookingsCount,
    totalSpend: customer.totalSpent,
    averageBasket: customer.bookingsCount ? Math.round(customer.totalSpent / customer.bookingsCount) : 0,
    lifetimeValue: customer.totalSpent,
    favouriteService: bookings[0]?.serviceName ?? '',
    preferredPayment: 'Transfer',
    retentionScore: Math.min(100, customer.bookingsCount * 12),
    churnRisk: customer.bookingsCount >= 5 ? 'Low' : 'Medium',
  })
}

const getProfile = async (id: string) => (isLive() ? mapProfile(await apiRequest<unknown>(`customer/single/${encodeURIComponent(id)}/`), id) : getMockProfile(id))

export const useCustomerProfile = (id: string) =>
  useQuery({ queryKey: [...queryKeys.customer, id], queryFn: () => getProfile(id), enabled: Boolean(id), staleTime: 60 * 1000 })
