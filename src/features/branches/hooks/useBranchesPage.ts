import { useNavigate } from 'react-router'
import { useBranchStaffCounts } from '@/api/attendants'
import { businessAddress, useBusinesses, type Business } from '@/api/business'
import { useActivateBusiness } from '@/features/business/hooks/useActivateBusiness'
import { useDisclosure } from '@/hooks/useDisclosure'
import { initials } from '@/lib/format'
import { branchPath, paths } from '@/routes/paths'
import { useAuthStore } from '@/stores/auth-store'
import { useBusinessStore } from '@/stores/business-store'
import { canCreateBusiness } from '@/stores/types'

export type BranchCardModel = {
  business: Business
  name: string
  initials: string
  address: string
  contact: string
  isCurrent: boolean
  staff: number | null
}

/**
 * Branches: as in sink-inventory, a branch is one of the owner's businesses
 * (GET/POST business/). Switching makes it the business the app works in, the
 * same as picking it on /select-business. Staff are assigned per branch.
 */
export function useBranchesPage() {
  const navigate = useNavigate()
  const { data: businesses = [], isLoading, isError, refetch } = useBusinesses()
  const currentId = useBusinessStore(state => state.businessId)
  const role = useAuthStore(state => state.user?.role)
  const activate = useActivateBusiness()
  const createModal = useDisclosure()
  const staffCounts = useBranchStaffCounts(businesses.map(business => business.id))

  // The branch you're in first.
  const sorted = [...businesses].sort((a, b) => Number(b.id === currentId) - Number(a.id === currentId))
  const cards: BranchCardModel[] = sorted.map(business => ({
    business,
    name: business.name || 'Untitled business',
    initials: initials(business.name || 'B'),
    address: businessAddress(business) || 'No address added yet',
    contact: [business.phone, business.email].filter(Boolean).join(' · '),
    isCurrent: business.id === currentId,
    staff: staffCounts[business.id] ?? null,
  }))

  return {
    cards,
    isLoading,
    isError,
    retry: () => void refetch(),
    isEmpty: !isLoading && !isError && businesses.length === 0,
    canCreate: canCreateBusiness(role),
    createModal,
    /** Sink refreshes the list after a create and stays on it. */
    onCreated: () => createModal.close(),
    switchTo: (business: Business) => {
      activate(business)
      navigate(paths.overview)
    },
    manageStaff: (business: Business) => navigate(branchPath(business.id)),
  }
}
