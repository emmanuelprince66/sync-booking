import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, apiRequest, mockDelay } from '@/lib/api-client'
import { queryClient as sharedQueryClient } from '@/lib/query-client'
import { useBusinessStore } from '@/stores/business-store'
import { useBusinessScope, type Business } from './business'
import { asRecord, isLive, listFrom, str } from './http'
import { queryKeys } from './query-keys'
import { sample } from './sample-data'

/**
 * Staff (attendant) accounts, same backend and flow as sink-inventory:
 *  GET    business/list_attendants/{business_id}/   → [{ id, name, role, businesses: [{ id, name }], permissions }]
 *  POST   business/add_attendant/{business_id}/     { firstname, lastname, phone, role, set_permissions? }
 *  GET    business/single_attendant/{id}/           → { id, firstname, lastname, phone, role, permissions }
 *  PATCH  business/single_attendant/{id}/           { firstname, lastname, phone, role, set_permissions? }
 *  PATCH  business/edit_attendant/{id}/             { role, set_permissions? }  (role and permissions only stick here)
 *  DELETE business/single_attendant/{id}/
 *  POST   business/single_attendant/business/{id}/  { business_ids: [...] }  (the full set of branches they work at)
 *
 * CLIQBOOK offers two roles only, with the backend's default permissions for each: `set_permissions`
 * is never sent, so the backend applies the role's defaults whenever the role is set.
 */

/**
 * The two roles CLIQBOOK hands out. Super admin is the backend's ADMIN-ATTENDANT (sink's
 * "Admin Attendant"): everything the owner can do. Attendant works on their own bookings.
 */
export const TEAM_ROLES = [
  { value: 'ATTENDANT', label: 'Attendant', hint: 'Their own bookings and service history, and the wallet’s transactions' },
  { value: 'ADMIN-ATTENDANT', label: 'Super admin', hint: 'Everything, like the owner: setup, services, wallet and every booking' },
] as const

export type TeamRole = typeof TEAM_ROLES[number]['value']
export const TEAM_ROLE_VALUES = TEAM_ROLES.map(role => role.value) as [TeamRole, ...TeamRole[]]
export const isTeamRole = (role: string): role is TeamRole => (TEAM_ROLE_VALUES as string[]).includes(role)

/** Every role the backend may return, so staff given an older sink role still read correctly. */
const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Owner',
  'ADMIN-ATTENDANT': 'Super admin',
  ATTENDANT: 'Attendant',
  MANAGER: 'Manager',
  PHARMACIST: 'Pharmacist',
  ACCOUNTANT: 'Accountant',
  'INVENTORY-MANAGER': 'Inventory Manager',
  'PRODUCTION-MANAGER': 'Production Manager',
}
export const roleLabel = (role: string) => ROLE_LABELS[role] ?? 'Team member'

export type AttendantBusiness = { id: string; name: string }
export type Attendant = { id: string; name: string; role: string; roleLabel: string; phone: string; isActive: boolean; businesses: AttendantBusiness[] }
export type AttendantDetail = { id: string; firstname: string; lastname: string; phone: string; role: string }

export type AttendantInput = { firstname: string; lastname: string; phone: string; role: string }
export type EditOptions = {
  /** The role is unchanged: save the details only, so permissions the backend already holds stay as they are. */
  keepRole?: boolean
}

// ─── Readers ────────────────────────────────────────────────────────────────

const unwrap = (value: unknown) => {
  const record = asRecord(value)
  const data = asRecord(record.data)
  return asRecord(data.data ?? record.data ?? record)
}

const readBusinesses = (value: unknown): AttendantBusiness[] =>
  listFrom(value, ['results', 'data']).map(item => {
    if (typeof item === 'string') return { id: item, name: '' }
    const record = asRecord(item)
    return { id: str(record.id) || str(record.business_id), name: str(record.name) || str(record.business_name) }
  }).filter(business => business.id)

const mapAttendant = (value: unknown): Attendant => {
  const record = asRecord(value)
  const user = asRecord(record.user)
  const pick = (key: string) => str(record[key]) || str(user[key])
  const role = (pick('role') || 'ATTENDANT').toUpperCase()
  const name = pick('name') || pick('full_name') || [pick('firstname'), pick('lastname')].filter(Boolean).join(' ') || pick('email') || 'Team member'
  return { id: str(record.id) || str(user.id), name, role, roleLabel: roleLabel(role), phone: pick('phone'), isActive: record.is_active !== false && user.is_active !== false, businesses: readBusinesses(record.businesses) }
}

const mapDetail = (value: unknown): AttendantDetail => {
  const record = unwrap(value)
  const [first = '', ...rest] = str(record.name).split(/\s+/)
  return {
    id: str(record.id),
    firstname: str(record.firstname) || first,
    lastname: str(record.lastname) || rest.join(' '),
    phone: str(record.phone),
    role: str(record.role).toUpperCase(),
  }
}

const SKIPPED_ERROR_KEYS = new Set(['message', 'error', 'detail', 'code', 'status', 'success', 'data'])

/**
 * The backend's own words for a failed request. DRF field errors ({ phone: ["…"] })
 * are read too, since the shared client only picks up message/error/detail.
 */
export const staffErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof ApiError) {
    if (error.message && !/^Request failed/.test(error.message)) return error.message
    const data = asRecord(error.data)
    for (const source of [asRecord(data.details), asRecord(data.errors), data]) {
      for (const [key, value] of Object.entries(source)) {
        if (SKIPPED_ERROR_KEYS.has(key)) continue
        const first = Array.isArray(value) ? str(value[0]) : str(value)
        if (first) return key === 'non_field_errors' ? first : `${key.replace(/_/g, ' ')}: ${first}`
      }
    }
    return fallback
  }
  return error instanceof Error && error.message ? error.message : fallback
}

// ─── Sample data (VITE_AUTH_MODE=mock) ──────────────────────────────────────

type MockStaff = { firstname: string; lastname: string; businessIds: string[] }
const mockStaff = new Map<string, MockStaff>()
const mockStaffOf = (attendant: Pick<Attendant, 'id' | 'name'>): MockStaff => {
  let found = mockStaff.get(attendant.id)
  if (!found) {
    const [firstname = '', ...rest] = attendant.name.split(/\s+/)
    found = { firstname, lastname: rest.join(' '), businessIds: attendant.id === 'sample-staff-maya' ? ['mock-business-1', 'mock-business-2'] : ['mock-business-1'] }
    mockStaff.set(attendant.id, found)
  }
  return found
}
const mockBusinessName = (id: string) => sharedQueryClient.getQueryData<Business[]>(queryKeys.businesses)?.find(business => business.id === id)?.name ?? ''
const withMockBusinesses = (attendant: Attendant): Attendant => ({
  ...attendant,
  businesses: mockStaffOf(attendant).businessIds.map(id => ({ id, name: mockBusinessName(id) })),
})
const findMock = (id: string) => {
  const attendant = sample.attendants.find(item => item.id === id)
  if (!attendant) throw new ApiError('Attendant not found.', 404, { message: 'Attendant not found.' })
  return attendant
}
const DUPLICATE_PHONE = 'A user with this phone number already exists.'
const assertPhoneFree = (phone: string, exceptId?: string) => {
  const digits = phone.replace(/\D/g, '')
  if (sample.attendants.some(item => item.id !== exceptId && item.phone.replace(/\D/g, '') === digits)) throw new ApiError(DUPLICATE_PHONE, 400, { message: DUPLICATE_PHONE })
}

// ─── Requests ───────────────────────────────────────────────────────────────

const getAttendants = async (businessId: string) => {
  if (!isLive()) return mockDelay(sample.attendants.map(withMockBusinesses))
  const response = await apiRequest<unknown>(`business/list_attendants/${businessId}/`)
  return listFrom(response, ['data', 'results', 'results.data', 'attendants']).map(mapAttendant)
}

/** Staff of any one of the owner's branches (sink lists attendants per business). */
const getBranchAttendants = async (businessId: string) => {
  if (!isLive()) return mockDelay(sample.attendants.map(withMockBusinesses).filter(attendant => attendant.businesses.some(business => business.id === businessId)))
  return getAttendants(businessId)
}

const getAttendant = async (id: string): Promise<AttendantDetail> => {
  if (!isLive()) {
    const attendant = findMock(id)
    const staff = mockStaffOf(attendant)
    return mockDelay({ id, firstname: staff.firstname, lastname: staff.lastname, phone: attendant.phone, role: attendant.role })
  }
  return mapDetail(await apiRequest<unknown>(`business/single_attendant/${id}/`))
}

const addAttendant = async (businessId: string, input: AttendantInput) => {
  if (!isLive()) {
    assertPhoneFree(input.phone)
    const id = `sample-staff-${Date.now()}`
    const name = `${input.firstname} ${input.lastname}`.trim()
    sample.attendants = [...sample.attendants, { id, name, role: input.role, roleLabel: roleLabel(input.role), phone: input.phone, isActive: true, businesses: [] }]
    // Mock queries are keyed on 'mock', so the business picked on /select-business is read from the store.
    mockStaff.set(id, { firstname: input.firstname, lastname: input.lastname, businessIds: [useBusinessStore.getState().businessId || 'mock-business-1'] })
    return mockDelay(null, 400)
  }
  return apiRequest<unknown>(`business/add_attendant/${businessId}/`, { method: 'POST', body: input })
}

/** As sink: details on single_attendant, then the role on edit_attendant (where it sticks) when it changed. */
const editAttendant = async (id: string, input: AttendantInput, { keepRole = false }: EditOptions) => {
  if (!isLive()) {
    assertPhoneFree(input.phone, id)
    const attendant = findMock(id)
    const staff = mockStaffOf(attendant)
    const roleChanged = attendant.role !== input.role
    sample.attendants = sample.attendants.map(item => item.id === id ? { ...item, name: `${input.firstname} ${input.lastname}`.trim(), phone: input.phone, role: input.role, roleLabel: roleChanged ? roleLabel(input.role) : item.roleLabel } : item)
    mockStaff.set(id, { ...staff, firstname: input.firstname, lastname: input.lastname })
    return mockDelay(null, 400)
  }
  const details = await apiRequest<unknown>(`business/single_attendant/${id}/`, { method: 'PATCH', body: input })
  if (keepRole) return details
  try {
    // No set_permissions: the backend applies the new role's default permissions.
    await apiRequest<unknown>(`business/edit_attendant/${id}/`, { method: 'PATCH', body: { role: input.role } })
  } catch (error) {
    throw new ApiError(staffErrorMessage(error, 'Details saved, but the role couldn’t be updated'), error instanceof ApiError ? error.status : 500, error instanceof ApiError ? error.data : null)
  }
  return details
}

const removeAttendant = async (id: string) => {
  if (!isLive()) {
    sample.attendants = sample.attendants.filter(attendant => attendant.id !== id)
    mockStaff.delete(id)
    return mockDelay(null, 300)
  }
  return apiRequest<unknown>(`business/single_attendant/${id}/`, { method: 'DELETE' })
}

/** Replaces the branches an attendant works at. Sink sends the full list and requires at least one. */
const setAttendantBusinesses = async (id: string, businessIds: string[]) => {
  if (!isLive()) {
    const attendant = findMock(id)
    mockStaff.set(id, { ...mockStaffOf(attendant), businessIds: [...businessIds] })
    return mockDelay(null, 300)
  }
  return apiRequest<unknown>(`business/single_attendant/business/${id}/`, { method: 'POST', body: { business_ids: businessIds } })
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

/** The current business's staff. Bookings and services pick from this list. */
export const useAttendants = () => {
  const { scope, enabled } = useBusinessScope()
  return useQuery({ queryKey: [...queryKeys.attendants, scope], queryFn: () => getAttendants(scope), enabled })
}

/** The current branch shares useAttendants' cache entry, so it isn't fetched twice. */
const branchAttendantsQuery = (businessId: string, scope: string) => {
  const isCurrent = businessId === scope
  return {
    queryKey: isCurrent ? [...queryKeys.attendants, scope] : [...queryKeys.attendants, 'branch', businessId],
    queryFn: () => (isCurrent ? getAttendants(businessId) : getBranchAttendants(businessId)),
    enabled: Boolean(businessId),
  }
}

/** Staff of any of the owner's branches. */
export const useBranchAttendants = (businessId: string) => {
  const { scope } = useBusinessScope()
  return useQuery(branchAttendantsQuery(businessId, scope))
}

/** Head count per branch (staff only, the owner left out), keyed by business id. Missing while loading or failed. */
export const useBranchStaffCounts = (businessIds: string[]) => {
  const { scope } = useBusinessScope()
  return useQueries({
    queries: businessIds.map(id => branchAttendantsQuery(id, scope)),
    combine: results => Object.fromEntries(results.flatMap((result, index) => result.data ? [[businessIds[index], result.data.filter(attendant => attendant.role !== 'OWNER').length]] : [])) as Record<string, number>,
  })
}

export const useAttendant = (id: string) =>
  useQuery({ queryKey: [...queryKeys.attendants, 'single', id], queryFn: () => getAttendant(id), enabled: Boolean(id) })

export const useAddAttendant = () => {
  const { scope } = useBusinessScope()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ input }: { input: AttendantInput }) => addAttendant(scope, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.attendants }),
  })
}

export const useEditAttendant = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input, options = {} }: { id: string; input: AttendantInput; options?: EditOptions }) => editAttendant(id, input, options),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.attendants }),
  })
}

export const useRemoveAttendant = () => {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: removeAttendant, onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.attendants }) })
}

export const useSetAttendantBusinesses = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, businessIds }: { id: string; businessIds: string[] }) => setAttendantBusinesses(id, businessIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.attendants }),
  })
}

/** Several attendants' branch lists in one go (the branch staff screen). Stops at the first failure. */
export const useSetBranchStaff = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (changes: { id: string; name: string; businessIds: string[] }[]) => {
      for (const change of changes) {
        try {
          await setAttendantBusinesses(change.id, change.businessIds)
        } catch (error) {
          throw new ApiError(`${change.name}: ${staffErrorMessage(error, 'could not be updated')}`, error instanceof ApiError ? error.status : 500, null)
        }
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.attendants }),
  })
}
