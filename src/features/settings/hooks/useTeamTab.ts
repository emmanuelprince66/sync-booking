import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { ATTENDANT_ROLES, useAddAttendant, useAttendants, useRemoveAttendant, type Attendant } from '@/api/attendants'
import { errorMessage } from '@/api/auth'
import { teamColor } from '@/features/bookings/utils'
import { initials } from '@/lib/format'
import { attendantSchema, type AttendantValues } from '../schemas'

/** Team & attendees: list, add and remove. The owner can't be removed. */
export function useTeamTab() {
  const query = useAttendants()
  const remove = useRemoveAttendant()
  const [modalOpen, setModalOpen] = useState(false)
  return {
    isLoading: query.isLoading,
    isError: query.isError,
    retry: () => void query.refetch(),
    members: (query.data ?? []).map((member, index) => ({ member, initials: initials(member.name || '?'), color: teamColor(index), canRemove: member.role !== 'OWNER' })),
    modalOpen,
    openModal: () => setModalOpen(true),
    closeModal: () => setModalOpen(false),
    removeMember: async (member: Attendant) => {
      try {
        await remove.mutateAsync(member.id)
        toast.success(`${member.name} removed`)
      } catch (error) {
        toast.error(errorMessage(error, 'Could not remove this attendee.'))
      }
    },
  }
}

export function useAttendantForm(onClose: () => void) {
  const add = useAddAttendant()
  const form = useForm<AttendantValues>({ resolver: zodResolver(attendantSchema), defaultValues: { firstname: '', lastname: '', phone: '', role: 'ATTENDANT' } })
  return {
    register: form.register,
    errors: form.formState.errors,
    roleOptions: ATTENDANT_ROLES,
    isSubmitting: add.isPending,
    onSubmit: form.handleSubmit(async values => {
      try {
        await add.mutateAsync(values)
        toast.success('Team invitation sent')
        onClose()
      } catch (error) {
        toast.error(errorMessage(error, 'Could not add this attendee.'))
      }
    }),
  }
}
