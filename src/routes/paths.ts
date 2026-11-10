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
  clients: '/clients',
  clientDetail: '/clients/:clientId',
  services: '/services',
  serviceCategories: '/services/categories',
  availability: '/availability',
  storefront: '/storefront',
  settings: '/settings',
  kyc: '/kyc',
} as const

/** One client's page. */
export const clientPath = (id: string) => `/clients/${encodeURIComponent(id)}`
