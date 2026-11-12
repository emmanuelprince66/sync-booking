import { useSearchParams } from 'react-router'
import { SERVICES_TABS, type ServicesTab } from '@/routes/paths'

const isServicesTab = (value: string | null): value is ServicesTab => (SERVICES_TABS as readonly string[]).includes(value ?? '')

export const SERVICES_TAB_OPTIONS: { value: ServicesTab; label: string }[] = [
  { value: 'services', label: 'Services' },
  { value: 'availability', label: 'Availability' },
  { value: 'history', label: 'Service history' },
]

/** The Services page's tab, kept in the URL (?tab=availability | history). */
export function useServicesTabs() {
  const [params, setParams] = useSearchParams()
  const raw = params.get('tab')
  const tab: ServicesTab = isServicesTab(raw) ? raw : 'services'
  return { tab, setTab: (next: ServicesTab) => setParams(next === 'services' ? {} : { tab: next }) }
}
