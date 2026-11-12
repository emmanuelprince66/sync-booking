import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { roleLabel } from '@/api/attendants'
import { useBusinesses, type Business } from '@/api/business'
import { useDefaultBookings } from '@/api/bookings'
import { useKycStatus } from '@/api/kyc'
import { useMarkAllNotificationsRead, useNotifications, useUnreadNotifications } from '@/api/notifications'
import { getBookingUrl, useStorefrontProfile } from '@/api/storefront'
import { formatActivityDate } from '@/api/http'
import { useActivateBusiness } from '@/features/business/hooks/useActivateBusiness'
import { useMenu } from '@/hooks/useMenu'
import { todayIso } from '@/lib/dates'
import { formatLongDate, initials } from '@/lib/format'
import { paths, setupPath } from '@/routes/paths'
import { useAuthStore, type AuthUser } from '@/stores/auth-store'
import { useBusinessDataStore } from '@/stores/business-data-store'
import { useBusinessStore } from '@/stores/business-store'
import { useUiStore } from '@/stores/ui-store'

const SUPPORT_EMAIL = 'support@sync360.africa'

const resolveUserName = (user: AuthUser | null | undefined) => {
  const fromParts = [user?.firstname, user?.lastname].filter(Boolean).join(' ')
  return fromParts || user?.fullName || user?.name || user?.email?.split('@')[0] || ''
}

/** Switch business and log out, shared by the sidebar block and the top-bar menu. */
function useAccountActions(closeMenu: () => void) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const queryClient = useQueryClient()
  const logout = useAuthStore(state => state.logout)
  return {
    /** The picker clears the old business's data only if a different one is chosen. */
    switchBusiness: () => {
      closeMenu()
      navigate(paths.selectBusiness, { state: { from: pathname } })
    },
    signOut: () => {
      closeMenu()
      logout()
      queryClient.clear()
      navigate(paths.login, { replace: true })
    },
  }
}

export type BranchOption = { business: Business; name: string; initials: string; isCurrent: boolean }

/**
 * The business block in the sidebar and its menu: the owner's branches (the same
 * business list as Setup → Branches) to switch between, Manage branches, Switch
 * business and Log out. `onNavigate` closes the mobile drawer after any action.
 */
export function useAccountMenu(onNavigate?: () => void) {
  const navigate = useNavigate()
  const business = useBusinessDataStore(state => state.businessData)
  const currentId = useBusinessStore(state => state.businessId)
  const branches = useBusinesses()
  const activate = useActivateBusiness()
  const menu = useMenu()
  const close = () => { menu.close(); onNavigate?.() }
  const actions = useAccountActions(close)
  const businessName = business?.name || 'Your business'
  const options: BranchOption[] = [...(branches.data ?? [])]
    .sort((a, b) => Number(b.id === currentId) - Number(a.id === currentId))
    .map(item => ({ business: item, name: item.name || 'Untitled business', initials: initials(item.name || 'B'), isCurrent: item.id === currentId }))
  return {
    ...menu,
    ...actions,
    businessName,
    businessLogo: business?.logo ?? '',
    businessInitials: initials(businessName),
    branches: options,
    branchesLoading: branches.isLoading,
    /** Same as Setup → Branches' Switch: clears the old branch's data, then opens the overview. */
    switchTo: (option: BranchOption) => {
      close()
      if (option.isCurrent) return
      activate(option.business)
      navigate(paths.overview)
    },
    manageBranches: () => { close(); navigate(setupPath('branches')) },
  }
}

/** Sidebar data: today's count on the Bookings link and the booking page card. */
export function useSidebar() {
  const { data: bookings } = useDefaultBookings()
  const { data: profile } = useStorefrontProfile()
  const today = todayIso()
  const todayCount = (bookings?.bookings ?? []).filter(booking => booking.date === today && booking.status !== 'CANCELLED').length
  const bookingUrl = profile ? getBookingUrl(profile) : null
  return {
    counts: { bookings: todayCount } as Record<string, number | undefined>,
    bookingHost: bookingUrl?.replace(/^https?:\/\//, '') ?? '',
    hasBookingPage: Boolean(bookingUrl),
    profileLoaded: Boolean(profile),
  }
}

/** Open state for the phone/tablet slide-in sidebar. */
export function useMobileSidebar() {
  const open = useUiStore(state => state.mobileNavOpen)
  const setOpen = useUiStore(state => state.setMobileNavOpen)
  const close = useCallback(() => setOpen(false), [setOpen])
  return { open, close, openMenu: () => setOpen(true) }
}

const firstNameOf = (user: AuthUser | null | undefined) =>
  user?.firstname || user?.name?.split(/\s+/)[0] || resolveUserName(user).split(/\s+/)[0] || ''

/** Top bar: the greeting, KYC badge and today's date. Identical on every page. */
export function useTopbar() {
  const user = useAuthStore(state => state.user)
  const businessName = useBusinessDataStore(state => state.businessData?.name) ?? ''
  const { data: kyc } = useKycStatus()
  const tier = kyc?.tier ?? 0
  return {
    firstName: firstNameOf(user),
    businessName,
    date: formatLongDate(),
    /** Shown once KYC status has loaded. */
    verification: kyc ? { text: tier > 0 ? 'Verified' : 'Pending', ok: tier > 0 } : null,
  }
}

/** The top bar's profile dropdown (sync-shipping's ProfileMenu). */
export function useProfileMenu() {
  const navigate = useNavigate()
  const user = useAuthStore(state => state.user)
  const businessName = useBusinessDataStore(state => state.businessData?.name) ?? ''
  const { data: kyc } = useKycStatus()
  const menu = useMenu()
  const actions = useAccountActions(menu.close)
  const name = resolveUserName(user)
  const tier = kyc?.tier ?? 0
  return {
    ...menu,
    ...actions,
    firstName: firstNameOf(user),
    fullName: name,
    email: user?.email ?? '',
    initials: initials(name || businessName || 'U'),
    roleLabel: user?.role ? roleLabel(user.role) : 'Owner',
    isOwner: !user?.role || user.role === 'OWNER',
    kycBadge: kyc ? { text: tier > 0 ? `Tier ${tier}` : 'Not started', ok: tier > 0 } : undefined,
    goToSettings: () => { menu.close(); navigate(paths.settings) },
    goToKyc: () => { menu.close(); navigate(paths.kyc) },
    openHelp: () => { menu.close(); window.location.href = `mailto:${SUPPORT_EMAIL}` },
  }
}

/** The bell: unread dot and the recent notifications panel. */
export function useNotificationBell() {
  const menu = useMenu()
  const { data: unread = 0 } = useUnreadNotifications()
  const list = useNotifications(menu.open)
  const markAll = useMarkAllNotificationsRead()
  return {
    ...menu,
    unread,
    isLoading: list.isLoading,
    notifications: (list.data ?? []).map(item => ({ ...item, when: formatActivityDate(item.createdAt) })),
    markAllRead: () => markAll.mutate(),
  }
}

/** The shell: which booking dialogs are mounted, and back to the top of the page on navigation. */
export function useAppShell() {
  const newBookingOpen = useUiStore(state => state.newBookingOpen)
  const hasSelectedBooking = useUiStore(state => Boolean(state.selectedBookingId))
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return { newBookingOpen, hasSelectedBooking }
}
