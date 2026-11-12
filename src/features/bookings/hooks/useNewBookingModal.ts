import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
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
import { newBookingSchema, type BookingLineValues, type NewBookingValues } from '../schemas'
import { buildSlots, dayOfWeekOf, eligibleStaff, minutesPassedOn, overlaps } from '../utils'

const CLIENT_RESULTS = 6
/** Sink only searches customers from three characters. */
const MIN_SEARCH = 3
const EMPTY_LINE: BookingLineValues = { serviceId: '', staffId: '', time: '' }
const joinNames = (names: string[]) => names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`

/** The two-step new booking dialog. Mounted only while open, so it always starts fresh. */
export function useNewBookingModal() {
  const setOpen = useUiStore(state => state.setNewBookingOpen)
  const close = () => setOpen(false)
  const money = useFormatMoney()
  const [step, setStep] = useState<1 | 2>(1)
  const [addingClient, setAddingClient] = useState(false)
  /** The + button opens the full Add client form (the same one as the Clients page). */
  const clientForm = useDisclosure()

  const form = useForm<NewBookingValues>({
    resolver: zodResolver(newBookingSchema),
    defaultValues: { customerId: '', clientName: '', clientPhone: '', clientEmail: '', date: todayIso(), lines: [EMPTY_LINE], paid: false, method: 'CASH', bankId: '', notes: '' },
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
  const allAttendants = useMemo(() => attendantsQuery.data ?? [], [attendantsQuery.data])
  const lineFields = useFieldArray({ control, name: 'lines' })
  const lines = useMemo(() => (values.lines ?? []).map(line => ({ serviceId: line?.serviceId ?? '', staffId: line?.staffId ?? '', time: line?.time ?? '' })), [values.lines])
  const serviceOf = (id: string) => services.find(item => item.id === id)
  const staffName = (id: string) => allAttendants.find(attendant => attendant.id === id)?.name ?? ''

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

  // ─── Step 2: a time per service line ───────────────────────────────────
  const date = values.date ?? ''
  const dayBookings = useBookings({ startDate: date, endDate: date }, { enabled: step === 2 && Boolean(date) })
  const blocked = useBlockedTimesForDates(step === 2 && date ? [date] : [])
  const day = scheduleQuery.data?.find(item => item.dayOfWeek === dayOfWeekOf(date))
  const intervalMinutes = (settingsQuery.data ?? DEFAULT_SETTINGS).bookingInterval
  /** Lines the dialog filled in itself (right after the line before), so a later change can move them along. */
  const [suggested, setSuggested] = useState<Set<number>>(() => new Set())
  const [attempted, setAttempted] = useState(false)

  const durationOf = (line: BookingLineValues) => serviceOf(line.serviceId)?.duration ?? 0
  const spanOf = (line: BookingLineValues) => [timeToMinutes(line.time), timeToMinutes(line.time) + durationOf(line)] as const
  /** A line's free start times: also leaves out what earlier lines already hold for the same attendant. */
  const slotsFor = (all: BookingLineValues[], index: number) => {
    const line = all[index]
    if (!line?.serviceId) return []
    return buildSlots({
      date,
      day,
      intervalMinutes,
      durationMinutes: durationOf(line),
      staffId: line.staffId,
      bookings: dayBookings.data?.bookings ?? [],
      blockedTimes: blocked.blockedTimes,
      reserved: all.slice(0, index).filter(other => other.time && other.staffId === line.staffId).map(spanOf),
    })
  }
  const lineSlots = lines.map((_, index) => slotsFor(lines, index))

  const passed = minutesPassedOn(date)
  const lineErrors = lines.map((line, index) => {
    if (!line.time) return attempted ? 'Choose a time for this service' : ''
    const [start, end] = spanOf(line)
    if (start <= passed) return 'That time has already passed today'
    const clash = lines.findIndex((other, otherIndex) => otherIndex !== index && Boolean(other.time) && other.staffId === line.staffId && overlaps(start, end, ...spanOf(other)))
    if (clash < 0) return ''
    const other = lines[clash]
    const [otherStart, otherEnd] = spanOf(other)
    return `Overlaps ${serviceOf(other.serviceId)?.name ?? 'another service'} (${minutesToTime(otherStart)}–${minutesToTime(otherEnd)}) with ${staffName(line.staffId) || 'the same attendant'}`
  })

  const setLineTime = (index: number, time: string) => {
    const next = lines.map(line => ({ ...line }))
    next[index].time = time
    const auto = new Set(suggested)
    auto.delete(index)
    setValue(`lines.${index}.time`, time)
    // Suggest each following line right after the one before, while it's free and not picked by hand.
    for (let after = index + 1; after < next.length; after++) {
      if (next[after].time && !auto.has(after)) break
      const previous = next[after - 1]
      const start = previous.time ? minutesToTime(spanOf(previous)[1]) : ''
      const fits = Boolean(start) && slotsFor(next, after).includes(start)
      next[after].time = fits ? start : ''
      if (fits) auto.add(after)
      else auto.delete(after)
      setValue(`lines.${after}.time`, next[after].time)
      if (!fits) break
    }
    setSuggested(auto)
  }

  const goToTimes = async () => {
    const ok = await trigger(['clientName', 'clientPhone', 'clientEmail', 'date', 'lines', 'bankId'])
    if (ok) setStep(2)
  }

  const submit = form.handleSubmit(async input => {
    setAttempted(true)
    if (input.lines.some(line => !line.time)) {
      toast.error(input.lines.length > 1 ? 'Choose a time for each service.' : 'Choose a time for this booking.')
      return
    }
    if (lineErrors.some(Boolean)) {
      toast.error('Fix the highlighted times first.')
      return
    }
    let client: Pick<Customer, 'id' | 'name' | 'phone' | 'email'>
    try {
      client = input.customerId
        ? { id: input.customerId, name: input.clientName, phone: input.clientPhone, email: input.clientEmail }
        : await createCustomer.mutateAsync({ name: input.clientName, phone: input.clientPhone, email: input.clientEmail })
    } catch (error) {
      toast.error(errorMessage(error, 'Could not add the client.'))
      return
    }
    // Saved once: retrying failed lines books the same client.
    if (!input.customerId) {
      setValue('customerId', client.id)
      setAddingClient(false)
    }

    const booked: { index: number; time: string }[] = []
    const failed: { index: number; label: string; reason: string }[] = []
    const unpaid: string[] = []
    // One booking per line (the backend takes one service per booking), one after another.
    for (const [index, line] of input.lines.entries()) {
      const service = serviceOf(line.serviceId)
      const label = `${service?.name ?? 'Service'} at ${line.time}`
      if (!service) {
        failed.push({ index, label, reason: 'This service is no longer available.' })
        continue
      }
      try {
        const bookingId = await createBooking.mutateAsync({
          serviceId: service.id,
          serviceName: service.name,
          customerId: client.id,
          customerName: client.name,
          customerPhone: client.phone,
          customerEmail: client.email,
          date: input.date,
          startTime: line.time,
          endTime: minutesToTime(timeToMinutes(line.time) + service.duration),
          durationMinutes: service.duration,
          price: service.amount,
          staffId: line.staffId,
          staffName: staffName(line.staffId),
          notes: input.notes.trim(),
        })
        booked.push({ index, time: line.time })
        if (input.paid && bookingId) {
          try {
            await checkout.mutateAsync({ id: bookingId, amount: service.amount, method: input.method, bankId: input.bankId || null })
          } catch {
            unpaid.push(label)
          }
        }
      } catch (error) {
        failed.push({ index, label, reason: errorMessage(error, 'Could not create the booking.') })
      }
    }

    if (unpaid.length) toast.error(`Booked, but the payment wasn’t recorded for ${joinNames(unpaid)}. Record it from the booking.`)
    const times = booked.map(item => item.time).join(', ')
    const confirmed = booked.length === 1 ? `Booking confirmed for ${client.name} · ${times}` : `${booked.length} bookings confirmed for ${client.name} · ${times}`
    if (!failed.length) {
      toast.success(confirmed)
      close()
      return
    }
    if (booked.length) toast.success(confirmed)
    toast.error(`Couldn’t book ${joinNames(failed.map(item => item.label))}. ${failed[0].reason}`, { duration: 10_000 })
    // Keep only the lines that failed, ready to try again.
    lineFields.remove(booked.map(item => item.index))
    setSuggested(new Set())
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
      /** The + button: the full Add client form; the saved client is selected for this booking. */
      startNew: () => { clientList.close(); clientForm.open() },
      isFormOpen: clientForm.isOpen,
      closeForm: clientForm.close,
      onCreated: (created: Customer) => pickClient(created),
      cancelAdding: () => { setAddingClient(false); setValue('clientPhone', ''); setValue('clientEmail', '') },
      pick: (client: Customer) => { pickClient(client); clientList.close() },
      clear: clearClient,
    },
    serviceOptions: services.map(item => ({ value: item.id, label: `${item.name} · ${money(item.amount)}` })),
    servicesLoading: servicesQuery.isLoading,
    lines: lineFields.fields.map((field, index) => {
      const line = lines[index] ?? EMPTY_LINE
      const service = serviceOf(line.serviceId)
      const slots = lineSlots[index] ?? []
      return {
        key: field.id,
        index,
        number: index + 1,
        serviceId: line.serviceId,
        staffId: line.staffId,
        serviceName: service?.name ?? '',
        staffName: staffName(line.staffId),
        detail: service ? `${durationLong(service.duration)} · ${money(service.amount)}` : '',
        attendantOptions: eligibleStaff(allAttendants, service).map(attendant => ({ value: attendant.id, label: attendant.name })),
        serviceError: errors.lines?.[index]?.serviceId?.message,
        staffError: errors.lines?.[index]?.staffId?.message,
        slots,
        time: line.time,
        /** A typed time that isn't one of the suggested slots. */
        isCustomTime: Boolean(line.time) && !slots.includes(line.time),
        isSuggested: suggested.has(index),
        endTime: service && line.time ? minutesToTime(timeToMinutes(line.time) + service.duration) : '',
        timeError: lineErrors[index] ?? '',
      }
    }),
    canRemoveLine: lineFields.fields.length > 1,
    addLine: () => lineFields.append({ ...EMPTY_LINE }, { shouldFocus: false }),
    removeLine: (index: number) => { lineFields.remove(index); setSuggested(new Set()) },
    setLineService: (index: number, id: string) => {
      const options = eligibleStaff(allAttendants, serviceOf(id))
      const current = lines[index]?.staffId ?? ''
      setValue(`lines.${index}.serviceId`, id, { shouldValidate: true })
      setValue(`lines.${index}.staffId`, options.some(option => option.id === current) ? current : options[0]?.id ?? '', { shouldValidate: true })
      setValue(`lines.${index}.time`, '')
    },
    setLineStaff: (index: number, id: string) => {
      setValue(`lines.${index}.staffId`, id, { shouldValidate: true })
      setValue(`lines.${index}.time`, '')
    },
    setLineTime,
    /** Earliest typed time allowed today. */
    minTime: passed >= 0 ? minutesToTime(Math.min(passed + 1, 24 * 60 - 1)) : undefined,
    bankOptions: (banksQuery.data ?? []).map(account => ({ value: account.id, label: maskedAccount(account) })),
    paid: values.paid ?? false,
    setPaid: (paid: boolean) => setValue('paid', paid),
    method: values.method ?? 'CASH',
    setMethod: (method: NewBookingValues['method']) => setValue('method', method),
    summary: (() => {
      const chosen = lines.map(line => serviceOf(line.serviceId)).filter(service => service !== undefined)
      const minutes = chosen.reduce((sum, service) => sum + service.duration, 0)
      const amount = chosen.reduce((sum, service) => sum + service.amount, 0)
      return {
        count: chosen.length,
        duration: minutes ? durationLong(minutes) : '—',
        amountDue: money(values.paid ? 0 : amount),
      }
    })(),
    dateLabel: date ? weekdayDayMonth(fromIsoDate(date)) : '',
    slotsLoading: dayBookings.isLoading || blocked.isLoading || scheduleQuery.isLoading,
    isClosedDay: Boolean(day?.isClosed),
    hasAllTimes: lines.length > 0 && lines.every(line => line.time),
  }
}

export type NewBookingModel = ReturnType<typeof useNewBookingModal>
