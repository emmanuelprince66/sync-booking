import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { BUSINESS_SECTOR_OPTIONS, CURRENCY_OPTIONS, useSaveStorefront, type StorefrontProfile } from '@/api/storefront'
import { useNigeriaStates } from '@/hooks/useNigeriaStates'
import { ABOUT_MAX, storeDetailsSchema, type StoreDetailsValues } from '../schemas'

const pickCurrency = (value: string) => (CURRENCY_OPTIONS as readonly string[]).includes(value) ? (value as StoreDetailsValues['currency']) : 'NGN'

const toValues = (profile: StorefrontProfile): StoreDetailsValues => ({
  name: profile.name,
  sector: profile.sector,
  tagline: profile.tagline,
  description: profile.description,
  phone: profile.phone,
  whatsapp: profile.whatsapp,
  email: profile.email,
  street: profile.street,
  city: profile.city,
  state: profile.state,
  country: profile.country,
  zipCode: profile.zipCode,
  currency: pickCurrency(profile.currency),
})

/** Store details and contact channels: name, category, tagline, about, phone/WhatsApp/email, address, currency. */
export function useStoreDetailsForm(profile: StorefrontProfile) {
  const save = useSaveStorefront()
  const statesQuery = useNigeriaStates()
  const form = useForm<StoreDetailsValues>({
    resolver: zodResolver(storeDetailsSchema),
    // `values` keeps the form in step when the profile refetches after a save.
    values: toValues(profile),
    resetOptions: { keepDirtyValues: true },
    mode: 'onBlur',
  })
  const watched = useWatch({ control: form.control })
  const state = watched.state ?? ''
  const isNigeria = (watched.country ?? '').trim().toLowerCase() === 'nigeria'

  const sectorOptions = useMemo(() => [...new Set([...(profile.sector ? [profile.sector] : []), ...BUSINESS_SECTOR_OPTIONS])], [profile.sector])
  const stateOptions = useMemo(() => {
    const names = (statesQuery.data ?? []).map(item => item.name)
    return state && !names.includes(state) ? [state, ...names] : names
  }, [statesQuery.data, state])

  return {
    register: form.register,
    errors: form.formState.errors,
    /** Draft values, for the live preview. */
    watched,
    dirty: form.formState.isDirty,
    reset: () => form.reset(toValues(profile)),
    onSubmit: form.handleSubmit(values => save.mutate(values, {
      onSuccess: () => { toast.success('Store details saved'); form.reset(values) },
      onError: error => toast.error(errorMessage(error, 'Could not save your store details.')),
    })),
    saving: save.isPending,
    sectorOptions,
    currencies: CURRENCY_OPTIONS,
    aboutCount: `${(watched.description ?? '').length}/${ABOUT_MAX}`,
    /** Nigerian addresses pick the state from the list; elsewhere it is typed. */
    stateIsList: isNigeria,
    stateOptions,
    statesLoading: statesQuery.isLoading,
    setState: (value: string) => form.setValue('state', value, { shouldDirty: true }),
    state,
  }
}

export type StoreDetailsModel = ReturnType<typeof useStoreDetailsForm>
