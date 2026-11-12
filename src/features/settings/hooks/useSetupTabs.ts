import { useSearchParams } from 'react-router'
import { SETUP_TABS, type SetupTab } from '@/routes/paths'

const isSetupTab = (value: string | null): value is SetupTab => (SETUP_TABS as readonly string[]).includes(value ?? '')

/** Setup's tab lives in the URL (?tab=…), and Branches' open branch in ?branch=…, so links and Back work. */
export function useSetupTabs() {
  const [params, setParams] = useSearchParams()
  const raw = params.get('tab')
  const tab: SetupTab = isSetupTab(raw) ? raw : 'kyc'
  const branchId = tab === 'branches' ? params.get('branch') ?? '' : ''
  return {
    tab,
    branchId,
    setTab: (next: SetupTab) => setParams(next === 'kyc' ? {} : { tab: next }),
  }
}
