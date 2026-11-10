import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { CANCELLATION_OPTIONS, DEFAULT_SETTINGS, useBookingSettings, useSaveBookingSettings } from '@/api/availability'
import { policiesSchema, type PoliciesValues } from '../schemas'

/** CLIQBOOK's booking policies: cancellation window, deposit refunds and the policy clients read before booking. */
export function usePolicies() {
  const settingsQuery = useBookingSettings()
  const save = useSaveBookingSettings()
  const settings = settingsQuery.data ?? DEFAULT_SETTINGS
  const values = useMemo<PoliciesValues>(() => ({
    policyText: settings.customPolicyText,
    cancellationWindowHours: String(settings.cancellationWindowHours),
    isDepositNonRefundable: settings.isDepositNonRefundable,
  }), [settings])
  const form = useForm<PoliciesValues>({ resolver: zodResolver(policiesSchema), values, resetOptions: { keepDirtyValues: true } })
  const nonRefundable = useWatch({ control: form.control, name: 'isDepositNonRefundable' })

  return {
    isLoading: settingsQuery.isLoading,
    register: form.register,
    errors: form.formState.errors,
    dirty: form.formState.isDirty,
    reset: () => form.reset(values),
    cancellationOptions: CANCELLATION_OPTIONS.map(value => ({ value: String(value), label: value === 0 ? 'No cancellations allowed' : `Up to ${value} hours before` })),
    nonRefundable,
    setNonRefundable: (value: boolean) => form.setValue('isDepositNonRefundable', value, { shouldDirty: true }),
    onSubmit: form.handleSubmit(async input => {
      try {
        await save.mutateAsync({ customPolicyText: input.policyText, cancellationWindowHours: Number(input.cancellationWindowHours), isDepositNonRefundable: input.isDepositNonRefundable })
        form.reset(input)
        toast.success('Policies saved')
      } catch (error) {
        toast.error(errorMessage(error, 'Could not save your policies.'))
      }
    }),
    saving: save.isPending,
  }
}

export type PoliciesModel = ReturnType<typeof usePolicies>
