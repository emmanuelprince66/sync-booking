import { useSearchParams } from 'react-router'
import { usePermissions } from '@/hooks/usePermissions'
import { SERVICES_TABS, type ServicesTab } from '@/routes/paths'

const isServicesTab = (value: string | null): value is ServicesTab => (SERVICES_TABS as readonly string[]).includes(value ?? '')

export const SERVICES_TAB_OPTIONS: { value: ServicesTab; label: string }[] = [
  { value: 'services', label: 'Services' },
  { value: 'availability', label: 'Availability' },
  { value: 'history', label: 'Service history' },
]

/**
 * The Services page's tab, kept in the URL (?tab=availability | history).
 * Attendants only get Service history: any other tab in the URL shows history instead.
 */
export function useServicesTabs() {
  const [params, setParams] = useSearchParams()
  const { canManageServices } = usePermissions()
  const raw = params.get('tab')
  const requested: ServicesTab = isServicesTab(raw) ? raw : 'services'
  const tab: ServicesTab = canManageServices ? requested : 'history'
  return {
    tab,
    setTab: (next: ServicesTab) => setParams(next === 'services' ? {} : { tab: next }),
    options: canManageServices ? SERVICES_TAB_OPTIONS : SERVICES_TAB_OPTIONS.filter(option => option.value === 'history'),
    /** Attendants see one tab, so the tab bar is left out. */
    showTabs: canManageServices,
    subtitle: canManageServices ? 'What you offer, when you’re open, and what has been booked.' : 'The services you’ve delivered, by date.',
  }
}
