import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { staffErrorMessage, useAttendants, useBranchAttendants, useSetBranchStaff, type Attendant } from '@/api/attendants'
import { businessAddress, useBusinesses } from '@/api/business'
import { teamColor } from '@/features/bookings/utils'
import { useActivateBusiness } from '@/features/business/hooks/useActivateBusiness'
import { useTeamAccess } from '@/features/team/hooks/useTeamAccess'
import { initials } from '@/lib/format'
import { paths } from '@/routes/paths'
import { useBusinessStore } from '@/stores/business-store'

export type BranchPerson = {
  attendant: Attendant
  initials: string
  color: string
  worksHere: boolean
  changed: boolean
  /** Their other branches, by name. */
  elsewhere: string[]
}

/**
 * One branch's staff. Candidates are everyone on the current team plus whoever
 * already works at the branch. Saving sends each changed person's full branch
 * list to single_attendant/business/{id}/, the same call sink makes from its
 * Manage businesses dialog; nobody can be left without a branch.
 */
export function useBranchStaffPage() {
  const { branchId = '' } = useParams()
  const navigate = useNavigate()
  const businesses = useBusinesses()
  const currentId = useBusinessStore(state => state.businessId)
  const team = useAttendants()
  const branchStaff = useBranchAttendants(branchId)
  const save = useSetBranchStaff()
  const activate = useActivateBusiness()
  const access = useTeamAccess()
  const [overrides, setOverrides] = useState<Record<string, boolean>>({})

  const branch = businesses.data?.find(business => business.id === branchId) ?? null
  const nameOf = (id: string, name: string) => name || businesses.data?.find(business => business.id === id)?.name || ''

  const byId = new Map<string, Attendant>()
  for (const attendant of [...(branchStaff.data ?? []), ...(team.data ?? [])]) {
    if (attendant.role === 'OWNER') continue
    const known = byId.get(attendant.id)
    if (!known || attendant.businesses.length > known.businesses.length) byId.set(attendant.id, attendant)
  }
  const onBranch = new Set((branchStaff.data ?? []).map(attendant => attendant.id))
  const people: BranchPerson[] = [...byId.values()].map((attendant, index) => {
    const original = onBranch.has(attendant.id) || attendant.businesses.some(business => business.id === branchId)
    const worksHere = overrides[attendant.id] ?? original
    return {
      attendant,
      initials: initials(attendant.name || '?'),
      color: teamColor(index),
      worksHere,
      changed: worksHere !== original,
      elsewhere: attendant.businesses.filter(business => business.id !== branchId).map(business => nameOf(business.id, business.name)).filter(Boolean),
    }
  }).sort((a, b) => Number(b.worksHere) - Number(a.worksHere) || a.attendant.name.localeCompare(b.attendant.name))

  const changed = people.filter(person => person.changed)

  return {
    branch,
    name: branch?.name || 'Branch',
    address: branch ? businessAddress(branch) : '',
    isCurrent: branchId === currentId,
    isNotFound: !businesses.isLoading && !businesses.isError && !branch,
    isLoading: businesses.isLoading || team.isLoading || branchStaff.isLoading,
    isError: businesses.isError || team.isError || branchStaff.isError,
    retry: () => { void businesses.refetch(); void team.refetch(); void branchStaff.refetch() },
    canManage: access.canManage,
    people,
    workingCount: people.filter(person => person.worksHere).length,
    changedCount: changed.length,
    toggle: (person: BranchPerson) => setOverrides(current => ({ ...current, [person.attendant.id]: !person.worksHere })),
    discard: () => setOverrides({}),
    isSaving: save.isPending,
    saveChanges: async () => {
      const updates = changed.map(person => {
        const ids = person.attendant.businesses.map(business => business.id).filter(id => id !== branchId)
        return { id: person.attendant.id, name: person.attendant.name, businessIds: person.worksHere ? [...ids, branchId] : ids }
      })
      const stranded = updates.find(update => update.businessIds.length === 0)
      if (stranded) {
        toast.error(`${stranded.name} has to work at one branch at least. Add them to another branch first, or delete them from the Team page.`)
        return
      }
      try {
        await save.mutateAsync(updates)
        toast.success(`${branch?.name || 'Branch'} staff updated`)
        setOverrides({})
      } catch (error) {
        toast.error(staffErrorMessage(error, 'Could not update this branch’s staff.'))
      }
    },
    switchHere: () => {
      if (!branch) return
      activate(branch)
      navigate(paths.overview)
    },
    goBack: () => navigate(paths.branches),
    goToTeam: () => navigate(paths.team),
  }
}
