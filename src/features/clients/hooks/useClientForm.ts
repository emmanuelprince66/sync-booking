import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useCreateCustomer, useUpdateCustomer, type Customer } from '@/api/customers'
import { useNigeriaStates } from '@/hooks/useNigeriaStates'
import { cityCentroid, coordinatesPayload, resolveCoordinates, type AddressSuggestion } from '@/lib/address'
import { GENDER_OPTIONS, GENDER_OPTIONS_EDIT } from '../constants'
import { clientSchema, type ClientValues } from '../schemas'
import { useCustomerPhoneLookup } from './useCustomerPhoneLookup'

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()

const toValues = (client: Customer | null): ClientValues => ({
  name: client?.name ?? '',
  phone: client?.phone ?? '',
  email: client?.email ?? '',
  gender: client?.gender === 'MALE' || client?.gender === 'FEMALE' || client?.gender === 'OTHER' ? client.gender : '',
  dateOfBirth: client?.dateOfBirth ?? '',
  address: client?.address?.address ?? '',
  addressPhone: client?.address?.phone ?? '',
  state: client?.address?.state ?? '',
  city: client?.address?.city ?? '',
  latitude: client?.address?.latitude ?? '',
  longitude: client?.address?.longitude ?? '',
})

/** Sink's customer form: same fields, rules and payload. Mounted with the dialog, so it opens with the saved values. */
export function useClientForm(client: Customer | null, onClose: () => void) {
  const create = useCreateCustomer()
  const update = useUpdateCustomer()
  const statesQuery = useNigeriaStates()
  const form = useForm<ClientValues>({ resolver: zodResolver(clientSchema), defaultValues: toValues(client) })
  const { control, setValue, setError, clearErrors } = form
  const [phone, gender, dateOfBirth, address, state, city, latitude, longitude] = useWatch({ control, name: ['phone', 'gender', 'dateOfBirth', 'address', 'state', 'city', 'latitude', 'longitude'] })
  const lookup = useCustomerPhoneLookup(phone, client?.id)

  const states = useMemo(() => statesQuery.data ?? [], [statesQuery.data])
  const selectedState = states.find(item => sameName(item.name, state))
  const cities = useMemo(() => selectedState?.cities ?? [], [selectedState])

  // A saved state or city the list doesn't know still has to show.
  const stateOptions = useMemo(() => {
    const options = states.map(item => ({ value: item.name, label: item.name }))
    return state && !states.some(item => sameName(item.name, state)) ? [{ value: state, label: state }, ...options] : options
  }, [states, state])
  const cityOptions = useMemo(() => {
    const options = cities.map(item => ({ value: item.name, label: item.name }))
    return city && !cities.some(item => sameName(item.name, city)) ? [{ value: city, label: city }, ...options] : options
  }, [cities, city])

  const clearCoordinates = () => {
    setValue('latitude', '')
    setValue('longitude', '')
  }

  return {
    register: form.register,
    errors: form.formState.errors,
    isEditing: Boolean(client),
    isSubmitting: create.isPending || update.isPending,
    genderOptions: client ? GENDER_OPTIONS_EDIT : GENDER_OPTIONS,
    gender,
    setGender: (value: string) => setValue('gender', value as ClientValues['gender']),
    dateOfBirth,
    setDateOfBirth: (value: string) => setValue('dateOfBirth', value),
    address,
    isAddressPinned: Boolean(latitude && longitude),
    setAddress: (value: string) => {
      setValue('address', value)
      clearErrors('address')
      if (latitude || longitude) clearCoordinates()
    },
    /** Picking a suggestion fills the state and city and pins the location. */
    pickAddress: (suggestion: AddressSuggestion) => {
      const match = states.find(item => item.isoCode === suggestion.stateCode || sameName(item.name, suggestion.state))
      setValue('address', suggestion.address || suggestion.label, { shouldValidate: true })
      if (match) setValue('state', match.name)
      else if (suggestion.state) setValue('state', suggestion.state)
      if (suggestion.city) setValue('city', suggestion.city)
      setValue('latitude', suggestion.latitude)
      setValue('longitude', suggestion.longitude)
    },
    state,
    stateOptions,
    statesLoading: statesQuery.isLoading,
    /** A hand-picked state invalidates the old city and coordinates. */
    setState: (value: string) => {
      setValue('state', value)
      setValue('city', '')
      clearErrors('address')
      clearCoordinates()
    },
    city,
    cityOptions,
    setCity: (value: string) => setValue('city', value),
    /** A state with no listed cities gets a text box, as in sink. */
    cityIsFreeText: Boolean(state) && !statesQuery.isLoading && cities.length === 0,
    cityDisabled: !state,
    phoneMatches: lookup.matches,
    isCheckingPhone: lookup.isSearching,
    /** Copies an existing client's details onto the form, only on request. */
    fillFrom: (match: Customer) => {
      const values = toValues(match)
      setValue('name', values.name, { shouldValidate: true })
      setValue('phone', values.phone, { shouldValidate: true })
      setValue('email', values.email)
      setValue('gender', values.gender)
      setValue('dateOfBirth', values.dateOfBirth)
      if (values.address) setValue('address', values.address)
      setValue('addressPhone', values.addressPhone)
      if (values.state) setValue('state', values.state)
      if (values.city) setValue('city', values.city)
      clearCoordinates()
    },
    onSubmit: form.handleSubmit(async values => {
      const street = values.address.trim()
      // The backend requires a street once any address is sent.
      if ((values.city || values.state) && !street) {
        setError('address', { message: 'Street address is required when city/state is set' })
        return
      }
      if (client?.address && !street) {
        setError('address', { message: 'The client’s default address cannot be blank' })
        return
      }
      const coords = resolveCoordinates({ latitude: values.latitude, longitude: values.longitude }, cityCentroid(states.find(item => sameName(item.name, values.state)), values.city))
      const input = {
        name: values.name,
        phone: values.phone,
        email: values.email,
        gender: values.gender,
        dateOfBirth: values.dateOfBirth,
        address: street
          ? {
            address: street,
            city: values.city,
            state: values.state,
            country: client?.address?.country || 'Nigeria',
            phone: values.addressPhone.trim(),
            latitude: '',
            longitude: '',
            isDefault: client?.address ? client.address.isDefault : true,
            ...coordinatesPayload(coords),
          }
          : undefined,
      }
      try {
        if (client) await update.mutateAsync({ id: client.id, input })
        else await create.mutateAsync(input)
        toast.success(client ? 'Client updated' : 'Client added')
        onClose()
      } catch (error) {
        toast.error(errorMessage(error, 'Could not save this client.'))
      }
    }),
  }
}
