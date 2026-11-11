import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { ATTENDANT_ROLES, ATTENDANT_ROLE_VALUES, staffErrorMessage, useAddAttendant, useAttendant, useEditAttendant, type Attendant, type AttendantRole } from '@/api/attendants'
import { ApiError } from '@/lib/api-client'
import { asRecord, str } from '@/api/http'
import { staffSchema, type StaffFormValues } from '../schemas'
import { usePermissionMatrix } from './usePermissionMatrix'

const EMPTY: StaffFormValues = { firstname: '', lastname: '', phone: '', role: undefined as unknown as AttendantRole }
const FIELDS = ['firstname', 'lastname', 'phone', 'role'] as const

const asRole = (role: string) => (ATTENDANT_ROLE_VALUES as string[]).includes(role) ? (role as AttendantRole) : EMPTY.role

/**
 * Add or edit a staff member (sink-inventory's AddStaff/EditStaff): personal details,
 * role, and the permissions checklist. Edit loads the saved details and permissions first.
 */
export function useStaffForm({ attendant, onClose }: { attendant: Attendant | null; onClose: () => void }) {
  const id = attendant?.id ?? ''
  const isEdit = Boolean(attendant)
  const detail = useAttendant(id)
  const add = useAddAttendant()
  const edit = useEditAttendant()

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: EMPTY,
    // Edit: fills in once single_attendant has loaded.
    values: detail.data ? { firstname: detail.data.firstname, lastname: detail.data.lastname, phone: detail.data.phone, role: asRole(detail.data.role) } : undefined,
    resetOptions: { keepDirtyValues: true },
  })
  const role = useWatch({ control: form.control, name: 'role' })
  const matrix = usePermissionMatrix({ role: role || undefined, attendantId: id || undefined, savedRole: detail.data?.role })

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
    const save = matrix.resolveForSave()
    try {
      if (isEdit) await edit.mutateAsync({ id, input: values, save })
      else await add.mutateAsync({ input: values, save })
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
    roleOptions: ATTENDANT_ROLES,
    matrix: matrix.editor,
    onSubmit,
    isSubmitting: add.isPending || edit.isPending,
    /** Edit: the saved details are still loading. */
    isLoading: isEdit && detail.isLoading,
    loadError: isEdit && detail.isError ? staffErrorMessage(detail.error, 'We couldn’t load this staff member.') : '',
    retry: () => void detail.refetch(),
  }
}
