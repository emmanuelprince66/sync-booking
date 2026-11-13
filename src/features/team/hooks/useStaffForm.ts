import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { TEAM_ROLES, isTeamRole, roleLabel, staffErrorMessage, useAddAttendant, useAttendant, useEditAttendant, type Attendant, type TeamRole } from '@/api/attendants'
import { ApiError } from '@/lib/api-client'
import { asRecord, str } from '@/api/http'
import { staffSchema, type StaffFormValues } from '../schemas'

const EMPTY: StaffFormValues = { firstname: '', lastname: '', phone: '', role: undefined as unknown as TeamRole }
const FIELDS = ['firstname', 'lastname', 'phone', 'role'] as const

const ROLE_OPTIONS = TEAM_ROLES.map(role => ({ value: role.value, label: role.label, hint: role.hint }))

/**
 * Add or edit a staff member (sink-inventory's AddStaff/EditStaff): personal details and
 * one of two roles, Attendant or Super admin, each with the backend's default permissions.
 * Someone on an older sink role (e.g. Manager) is asked to pick one of the two on edit.
 */
export function useStaffForm({ attendant, onClose }: { attendant: Attendant | null; onClose: () => void }) {
  const id = attendant?.id ?? ''
  const isEdit = Boolean(attendant)
  const detail = useAttendant(id)
  const add = useAddAttendant()
  const edit = useEditAttendant()
  const savedRole = detail.data?.role ?? ''

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: EMPTY,
    // Edit: fills in once single_attendant has loaded.
    values: detail.data ? { firstname: detail.data.firstname, lastname: detail.data.lastname, phone: detail.data.phone, role: isTeamRole(savedRole) ? savedRole : EMPTY.role } : undefined,
    resetOptions: { keepDirtyValues: true },
  })
  const role = useWatch({ control: form.control, name: 'role' })

  /** Field errors from the backend go under their fields as well as in the toast. */
  const showFieldErrors = (error: unknown) => {
    if (!(error instanceof ApiError)) return
    const data = asRecord(error.data)
    for (const field of FIELDS) {
      const value = data[field]
      const message = Array.isArray(value) ? str(value[0]) : str(value)
      if (message) form.setError(field, { message })
    }
  }

  const onSubmit = form.handleSubmit(async values => {
    try {
      // Same role: only the details are saved, so the permissions they already have stay put.
      if (isEdit) await edit.mutateAsync({ id, input: values, options: { keepRole: values.role === savedRole } })
      else await add.mutateAsync({ input: values })
      toast.success(isEdit ? 'Staff member updated' : 'Staff member added')
      onClose()
    } catch (error) {
      showFieldErrors(error)
      toast.error(staffErrorMessage(error, isEdit ? 'Could not update this staff member.' : 'Could not add this staff member.'))
    }
  })

  return {
    isEdit,
    register: form.register,
    errors: form.formState.errors,
    roleOptions: ROLE_OPTIONS,
    /** What the chosen role can do, under the select. */
    roleHint: TEAM_ROLES.find(option => option.value === role)?.hint ?? '',
    /** Edit of someone on an older role that isn't offered any more. */
    legacyRoleNote: isEdit && savedRole && !isTeamRole(savedRole) ? `Currently ${roleLabel(savedRole)}. Choose Attendant or Super admin to save.` : '',
    onSubmit,
    isSubmitting: add.isPending || edit.isPending,
    /** Edit: the saved details are still loading. */
    isLoading: isEdit && detail.isLoading,
    loadError: isEdit && detail.isError ? staffErrorMessage(detail.error, 'We couldn’t load this staff member.') : '',
    retry: () => void detail.refetch(),
  }
}
