import { useState } from 'react'
import { toast } from 'sonner'
import { staffErrorMessage, useSetAttendantBusinesses, type Attendant } from '@/api/attendants'
import { businessAddress, useBusinesses } from '@/api/business'
import { initials } from '@/lib/format'

/**
 * Which branches one staff member works at (sink's ManageAttendantBusinessesModal):
 * tick businesses and save the full list. At least one is required.
 */
export function useAttendantBranches({ attendant, onClose }: { attendant: Attendant; onClose: () => void }) {
  const businesses = useBusinesses()
  const save = useSetAttendantBusinesses()
  const [selected, setSelected] = useState<string[]>(() => attendant.businesses.map(business => business.id))

  // Ticked first, as in sink.
  const list = [...(businesses.data ?? [])].sort((a, b) => Number(selected.includes(b.id)) - Number(selected.includes(a.id)))

  return {
    name: attendant.name,
    isLoading: businesses.isLoading,
    isError: businesses.isError,
    retry: () => void businesses.refetch(),
    branches: list.map(business => ({
      id: business.id,
      name: business.name || 'Untitled business',
      initials: initials(business.name || 'B'),
      logo: business.logo,
      type: business.type,
      address: businessAddress(business) || [business.city, business.country].filter(Boolean).join(', '),
      selected: selected.includes(business.id),
    })),
    selectedCount: selected.length,
    toggle: (id: string) => setSelected(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]),
    isSaving: save.isPending,
    submit: async () => {
      if (selected.length === 0) {
        toast.error('Please select at least one branch')
        return
      }
      try {
        await save.mutateAsync({ id: attendant.id, businessIds: selected })
        toast.success(`${attendant.name}’s branches updated`)
        onClose()
      } catch (error) {
        toast.error(staffErrorMessage(error, 'Failed to update branches'))
      }
    },
  }
}
