import { lazy } from 'react'

/** Page modules, split per route. Import functions are kept so pages can be warmed up before they're needed. */
const loaders = {
  auth: () => import('@/features/auth/AuthPage'),
  selectBusiness: () => import('@/features/business/SelectBusinessPage'),
  overview: () => import('@/features/overview/OverviewPage'),
  calendar: () => import('@/features/calendar/CalendarPage'),
  bookings: () => import('@/features/bookings/BookingsPage'),
  wallet: () => import('@/features/wallet/WalletPage'),
  clients: () => import('@/features/clients/ClientsPage'),
  clientDetail: () => import('@/features/clients/ClientDetailPage'),
  services: () => import('@/features/services/ServicesPage'),
  categories: () => import('@/features/categories/CategoriesPage'),
  availability: () => import('@/features/availability/AvailabilityPage'),
  storefront: () => import('@/features/storefront/StorefrontPage'),
  settings: () => import('@/features/settings/SettingsPage'),
  kyc: () => import('@/features/kyc/KycPage'),
  team: () => import('@/features/team/TeamPage'),
  branches: () => import('@/features/branches/BranchesPage'),
  branchStaff: () => import('@/features/branches/BranchStaffPage'),
}

export const pages = {
  AuthPage: lazy(loaders.auth),
  SelectBusinessPage: lazy(loaders.selectBusiness),
  OverviewPage: lazy(loaders.overview),
  CalendarPage: lazy(loaders.calendar),
  BookingsPage: lazy(loaders.bookings),
  WalletPage: lazy(loaders.wallet),
  ClientsPage: lazy(loaders.clients),
  ClientDetailPage: lazy(loaders.clientDetail),
  ServicesPage: lazy(loaders.services),
  CategoriesPage: lazy(loaders.categories),
  AvailabilityPage: lazy(loaders.availability),
  StorefrontPage: lazy(loaders.storefront),
  SettingsPage: lazy(loaders.settings),
  KycPage: lazy(loaders.kyc),
  TeamPage: lazy(loaders.team),
  BranchesPage: lazy(loaders.branches),
  BranchStaffPage: lazy(loaders.branchStaff),
}

/** Downloads the app's pages in the background, ignoring failures, so navigating never waits on code. */
export const preloadAppShell = () => {
  for (const load of Object.values(loaders)) load().catch(() => undefined)
}
