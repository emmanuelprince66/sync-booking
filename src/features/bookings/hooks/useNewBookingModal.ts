import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { useAttendants } from '@/api/attendants'
import { errorMessage } from '@/api/auth'
import { DEFAULT_SETTINGS, useBlockedTimesForDates, useBookingSettings, useSchedule } from '@/api/availability'
import { maskedAccount, useSettlementAccounts } from '@/api/banks'
import { useBookings, useCheckoutBooking, useCreateBooking } from '@/api/bookings'
import { useCreateCustomer, useCustomers, type Customer } from '@/api/customers'
import { useAllServices } from '@/api/services'
import { useDisclosure } from '@/hooks/useDisclosure'
import { useDebounce } from '@/hooks/useDebounce'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { durationLong, fromIsoDate, minutesToTime, timeToMinutes, todayIso, weekdayDayMonth } from '@/lib/dates'
import { useUiStore } from '@/stores/ui-store'
import { newBookingSchema, type NewBookingValues } from '../schemas'
import { buildSlots, dayOfWeekOf, eligibleStaff } from '../utils'

const CLIENT_RESULTS = 6
/** Sink only searches customers from three characters. */
const MIN_SEARCH = 3

/** The two-step new booking dialog. Mounted only while open, so it always starts fresh. */
export function useNewBookingModal() {
  const setOpen = useUiStore(state => state.setNewBookingOpen)
  const close = () => setOpen(false)
  const money = useFormatMoney()
  const [step, setStep] = useState<1 | 2>(1)
  const [addingClient, setAddingClient] = useState(false)

  const form = useForm<NewBookingValues>({
    resolver: zodResolver(newBookingSchema),
    defaultValues: { customerId: '', clientName: '', clientPhone: '', clientEmail: '', serviceId: '', date: todayIso(), staffId: '', paid: false, method: 'CASH', bankId: '', time: '', notes: '' },
  })
  const { control, register, setValue, trigger, formState: { errors, isSubmitting } } = form
  const values = useWatch({ control })

  const servicesQuery = useAllServices()
  const attendantsQuery = useAttendants()
  const banksQuery = useSettlementAccounts()
  const scheduleQuery = useSchedule()
  const settingsQuery = useBookingSettings()
  const createCustomer = useCreateCustomer()
  const createBooking = useCreateBooking()
  const checkout = useCheckoutBooking()

  const services = useMemo(() => (servicesQuery.data?.services ?? []).filter(service => service.isActive), [servicesQuery.data])
  const service = services.find(item => item.id === values.serviceId)
  const attendants = useMemo(() => eligibleStaff(attendantsQuery.data ?? [], service), [attendantsQuery.data, service])

  // ─── Client search ──────────────────────────────────────────────────────
  const clientName = values.clientName ?? ''
  const customerId = values.customerId ?? ''
  const debouncedName = useDebounce(clientName, 400)
  const search = debouncedName.trim().length >= MIN_SEARCH ? debouncedName.trim() : ''
  const clientQuery = useCustomers({ search, limit: CLIENT_RESULTS, enabled: step === 1 && !customerId && !addingClient })

  const pickClient = (client: Customer) => {
    setValue('customerId', client.id)
    setValue('clientName', client.name, { shouldValidate: true })
    setValue('clientPhone', client.phone)
    setValue('clientEmail', client.email)
    setAddingClient(false)
  }
  const clearClient = () => {
    setValue('customerId', '')
    setValue('clientName', '')
    setValue('clientPhone', '')
    setValue('clientEmail', '')
    setAddingClient(false)
  }

  const clientField = register('clientName')
  // Closed until the client field is clicked or typed in: focus alone (the dialog focuses it on open) doesn't count.
  const clientList = useDisclosure()

  // ─── Step 2: times ──────────────────────────────────────────────────────
  const date = values.date ?? ''
  const staffId = values.staffId ?? ''
  const dayBookings = useBookings({ startDate: date, endDate: date }, { enabled: step === 2 && Boolean(date) })
  const blocked = useBlockedTimesForDates(step === 2 && date ? [date] : [])
  const day = scheduleQuery.data?.find(item => item.dayOfWeek === dayOfWeekOf(date))
  const durationMinutes = service?.duration ?? 0
  const slots = useMemo(() => buildSlots({
    date,
    day,
    intervalMinutes: (settingsQuery.data ?? DEFAULT_SETTINGS).bookingInterval,
    durationMinutes,
    staffId,
    bookings: dayBookings.data?.bookings ?? [],
    blockedTimes: blocked.blockedTimes,
  }), [date, day, settingsQuery.data, durationMinutes, staffId, dayBookings.data, blocked.blockedTimes])

  const goToTimes = async () => {
    const ok = await trigger(['clientName', 'clientPhone', 'clientEmail', 'serviceId', 'date', 'staffId', 'bankId'])
    if (ok) setStep(2)
  }

  const submit = form.handleSubmit(async input => {
    if (!service) return
    if (!input.time) {
      toast.error('Choose a time for this booking.')
      return
    }
    try {
      const client = input.customerId
        ? { id: input.customerId, name: input.clientName, phone: input.clientPhone, email: input.clientEmail }
        : await createCustomer.mutateAsync({ name: input.clientName, phone: input.clientPhone, email: input.clientEmail })
      const bookingId = await createBooking.mutateAsync({
        serviceId: service.id,
        serviceName: service.name,
        customerId: client.id,
        customerName: client.name,
        customerPhone: client.phone,
        customerEmail: client.email,
        date: input.date,
        startTime: input.time,
        endTime: minutesToTime(timeToMinutes(input.time) + service.duration),
        durationMinutes: service.duration,
        price: service.amount,
        staffId: input.staffId,
        staffName: attendants.find(attendant => attendant.id === input.staffId)?.name ?? '',
        notes: input.notes.trim(),
      })
      if (input.paid && bookingId) {
        try {
          await checkout.mutateAsync({ id: bookingId, amount: service.amount, method: input.method, bankId: input.bankId || null })
        } catch (error) {
          toast.error(`Booking created, but the payment wasn’t recorded. ${errorMessage(error)}`)
        }
      }
      toast.success(`Booking confirmed for ${input.time}`)
      close()
    } catch (error) {
      toast.error(errorMessage(error, 'Could not create the booking.'))
    }
  })

  const onContinue = () => { if (step === 1) void goToTimes() }

  const clientResults = clientQuery.data?.customers ?? []
  const canAddClient = clientName.trim().length > 0 && !addingClient && !customerId

  return {
    control,
    step,
    goBack: () => setStep(1),
    onContinue,
    submit,
    close,
    register,
    errors,
    isSubmitting,
    isClientSelected: Boolean(customerId),
    client: {
      field: {
        ...clientField,
        onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
          // While adding a new client the box is just their name, so no search list.
          if (!addingClient) clientList.open()
          return clientField.onChange(event)
        },
        onClick: clientList.open,
      },
      name: clientName,
      phone: values.clientPhone ?? '',
      results: clientResults,
      isSearching: clientQuery.isFetching,
      adding: addingClient,
      isListOpen: clientList.isOpen,
      closeList: clientList.close,
      showResults: clientList.isOpen && !customerId && !addingClient && (clientResults.length > 0 || canAddClient),
      canAddNew: canAddClient,
      startAdding: () => { setAddingClient(true); clientList.close() },
      /** The + button: a blank new client, typed straight into the name box. */
      startNew: () => { clearClient(); setAddingClient(true); clientList.close() },
      cancelAdding: () => { setAddingClient(false); setValue('clientPhone', ''); setValue('clientEmail', '') },
      pick: (client: Customer) => { pickClient(client); clientList.close() },
      clear: clearClient,
    },
    serviceOptions: services.map(item => ({ value: item.id, label: `${item.name} · ${money(item.amount)}` })),
    servicesLoading: servicesQuery.isLoading,
    onServiceChange: (id: string) => {
      setValue('serviceId', id, { shouldValidate: true })
      const next = eligibleStaff(attendantsQuery.data ?? [], services.find(item => item.id === id))
      setValue('staffId', next[0]?.id ?? '', { shouldValidate: Boolean(next[0]) })
    },
    attendantOptions: attendants.map(attendant => ({ value: attendant.id, label: attendant.name })),
    bankOptions: (banksQuery.data ?? []).map(account => ({ value: account.id, label: maskedAccount(account) })),
    paid: values.paid ?? false,
    setPaid: (paid: boolean) => setValue('paid', paid),
    method: values.method ?? 'CASH',
    setMethod: (method: NewBookingValues['method']) => setValue('method', method),
    summary: {
      duration: service ? durationLong(service.duration) : '—',
      amountDue: money(values.paid || !service ? 0 : service.amount),
    },
    dateLabel: date ? weekdayDayMonth(fromIsoDate(date)) : '',
    slots,
    slotsLoading: dayBookings.isLoading || blocked.isLoading || scheduleQuery.isLoading,
    isClosedDay: Boolean(day?.isClosed),
    time: values.time ?? '',
    setTime: (time: string) => setValue('time', time),
    /** A typed time that isn't one of the suggested slots. */
    isCustomTime: Boolean(values.time) && !slots.includes(values.time ?? ''),
  }
}

export type NewBookingModel = ReturnType<typeof useNewBookingModal>
