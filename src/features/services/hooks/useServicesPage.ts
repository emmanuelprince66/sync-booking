import { useMemo, useState, type KeyboardEvent } from 'react'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useDefaultBookings } from '@/api/bookings'
import { SERVICES_PAGE_SIZE, useDeleteService, useServices, useSetServiceActive, type Service } from '@/api/services'
import { serviceColor } from '@/features/bookings/utils'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { durationLong } from '@/lib/dates'
import { initials } from '@/lib/format'

export type ServiceDialog = { mode: 'add' } | { mode: 'edit'; service: Service } | { mode: 'delete'; service: Service } | null

/** Services: server-side pages, the live summary banner, activate, edit and delete. */
export function useServicesPage() {
  const money = useFormatMoney()
  const [page, setPage] = useState(1)
  const [dialog, setDialog] = useState<ServiceDialog>(null)
  const query = useServices(page, SERVICES_PAGE_SIZE)
  const bookingsQuery = useDefaultBookings()
  const setActive = useSetServiceActive()
  const remove = useDeleteService()

  const services = useMemo(() => query.data?.services ?? [], [query.data])
  const bookedByService = useMemo(() => {
    const counts = new Map<string, number>()
    for (const booking of bookingsQuery.data?.bookings ?? []) {
      if (booking.status !== 'CANCELLED') counts.set(booking.serviceId, (counts.get(booking.serviceId) ?? 0) + 1)
    }
    return counts
  }, [bookingsQuery.data])

  const active = services.filter(service => service.isActive)
  const average = active.length ? active.reduce((sum, service) => sum + service.amount, 0) / active.length : 0
  const total = query.data?.total ?? services.length

  return {
    cards: services.map((service, index) => {
      const count = bookedByService.get(service.id) ?? 0
      return {
        service,
        initials: initials(service.name || '?'),
        color: serviceColor(index),
        duration: durationLong(service.duration),
        price: money(service.amount),
        bookings: `${count} ${count === 1 ? 'booking' : 'bookings'}`,
      }
    }),
    banner: {
      title: active.length ? 'Your service menu is live' : 'Your service menu is empty',
      note: active.length ? `${total} ${total === 1 ? 'service' : 'services'} · Average price ${money(Math.round(average))}` : 'Add a service so clients can start booking.',
      showPill: active.length > 0,
    },
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    retry: () => void query.refetch(),
    isEmpty: !query.isLoading && services.length === 0,
    page,
    totalPages: query.data?.pages ?? 1,
    setPage,
    dialog,
    openAdd: () => setDialog({ mode: 'add' }),
    openEdit: (service: Service) => setDialog({ mode: 'edit', service }),
    openDelete: (service: Service) => setDialog({ mode: 'delete', service }),
    onCardKeyDown: (event: KeyboardEvent, service: Service) => {
      // Keys pressed on the menu inside the card belong to the menu.
      if (event.target !== event.currentTarget || (event.key !== 'Enter' && event.key !== ' ')) return
      event.preventDefault()
      setDialog({ mode: 'edit', service })
    },
    closeDialog: () => setDialog(null),
    toggleActive: async (service: Service) => {
      try {
        await setActive.mutateAsync({ id: service.id, isActive: !service.isActive })
        toast.success(service.isActive ? 'Service deactivated' : 'Service activated')
      } catch (error) {
        toast.error(errorMessage(error, 'Could not update this service.'))
      }
    },
    isDeleting: remove.isPending,
    confirmDelete: async (service: Service) => {
      try {
        await remove.mutateAsync(service.id)
        toast.success(`${service.name} deleted`)
        setDialog(null)
      } catch (error) {
        toast.error(errorMessage(error, 'Could not delete this service.'))
      }
    },
  }
}
