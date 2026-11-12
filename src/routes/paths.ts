export const paths = {
  login: '/login',
  signup: '/signup',
  signupVerify: '/signup/verify',
  signupBusiness: '/signup/business',
  signupKyc: '/signup/kyc',
  selectBusiness: '/select-business',
  dashboard: '/',
  overview: '/',
  calendar: '/calendar',
  bookings: '/bookings',
  wallet: '/wallet',
  clients: '/clients',
  clientDetail: '/clients/:clientId',
  services: '/services',
  serviceCategories: '/services/categories',
  availability: '/availability',
  storefront: '/storefront',
  settings: '/settings',
  kyc: '/kyc',
  team: '/team',
  branches: '/branches',
  branchDetail: '/branches/:branchId',
} as const

/** Tabs of the Setup page (/settings?tab=…). Team, Branches and Storefront live here, not in the sidebar. */
export const SETUP_TABS = ['kyc', 'payments', 'domain', 'storefront', 'team', 'branches'] as const
export type SetupTab = typeof SETUP_TABS[number]
export const setupPath = (tab: SetupTab) => `${paths.settings}?tab=${tab}`

/** One branch's staff: a sub-view of Setup → Branches. */
export const branchPath = (id: string) => `${paths.settings}?tab=branches&branch=${encodeURIComponent(id)}`

/** Tabs of the Services page (/services?tab=…). Availability lives here, not in the sidebar. */
export const SERVICES_TABS = ['services', 'availability', 'history'] as const
export type ServicesTab = typeof SERVICES_TABS[number]
export const servicesPath = (tab: ServicesTab) => (tab === 'services' ? paths.services : `${paths.services}?tab=${tab}`)

/** One client's page. */
export const clientPath = (id: string) => `/clients/${encodeURIComponent(id)}`
