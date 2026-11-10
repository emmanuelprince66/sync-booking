import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest, mockDelay } from '@/lib/api-client'
import { useBusinessScope } from './business'
import { asRecord, isLive, listFrom, str } from './http'
import { queryKeys } from './query-keys'
import { sample } from './sample-data'

/**
 * Team, same backend as sink-inventory:
 *  GET    business/list_attendants/{business_id}/
 *  POST   business/add_attendant/{business_id}/   { firstname, lastname, phone, role }
 *  DELETE business/single_attendant/{id}/
 */

export const ATTENDANT_ROLES = [
  { value: 'ATTENDANT', label: 'Attendant' },
  { value: 'ADMIN-ATTENDANT', label: 'Admin' },
  { value: 'ACCOUNTANT', label: 'Accountant' },
] as const

const ROLE_LABELS: Record<string, string> = { OWNER: 'Owner', 'ADMIN-ATTENDANT': 'Admin', ATTENDANT: 'Attendant', PHARMACIST: 'Pharmacist', ACCOUNTANT: 'Accountant', 'INVENTORY-MANAGER': 'Inventory manager', 'PRODUCTION-MANAGER': 'Production manager' }
export const roleLabel = (role: string) => ROLE_LABELS[role] ?? 'Team member'

export type Attendant = { id: string; name: string; role: string; roleLabel: string; phone: string; isActive: boolean }
export type AttendantInput = { firstname: string; lastname: string; phone: string; role: string }

const mapAttendant = (value: unknown): Attendant => {
  const record = asRecord(value)
  const user = asRecord(record.user)
  const pick = (key: string) => str(record[key]) || str(user[key])
  const role = (pick('role') || 'ATTENDANT').toUpperCase()
  const name = pick('name') || pick('full_name') || [pick('firstname'), pick('lastname')].filter(Boolean).join(' ') || pick('email') || 'Team member'
  return { id: str(record.id) || str(user.id), name, role, roleLabel: roleLabel(role), phone: pick('phone'), isActive: record.is_active !== false && user.is_active !== false }
}

const getAttendants = async (businessId: string) => {
  if (!isLive()) return mockDelay([...sample.attendants])
  const response = await apiRequest<unknown>(`business/list_attendants/${businessId}/`)
  return listFrom(response, ['data', 'results', 'results.data', 'attendants']).map(mapAttendant)
}

const addAttendant = async (businessId: string, input: AttendantInput) => {
  if (!isLive()) {
    sample.attendants = [...sample.attendants, { id: `sample-staff-${Date.now()}`, name: `${input.firstname} ${input.lastname}`.trim(), role: input.role, roleLabel: roleLabel(input.role), phone: input.phone, isActive: true }]
    return mockDelay(null, 400)
  }
  return apiRequest<unknown>(`business/add_attendant/${businessId}/`, { method: 'POST', body: input })
}

const removeAttendant = async (id: string) => {
  if (!isLive()) {
    sample.attendants = sample.attendants.filter(attendant => attendant.id !== id)
    return mockDelay(null, 300)
  }
  return apiRequest<unknown>(`business/single_attendant/${id}/`, { method: 'DELETE' })
}

export const useAttendants = () => {
  const { scope, enabled } = useBusinessScope()
  return useQuery({ queryKey: [...queryKeys.attendants, scope], queryFn: () => getAttendants(scope), enabled })
}

export const useAddAttendant = () => {
  const { scope } = useBusinessScope()
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: (input: AttendantInput) => addAttendant(scope, input), onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.attendants }) })
}

export const useRemoveAttendant = () => {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: removeAttendant, onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.attendants }) })
}
