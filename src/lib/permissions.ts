import type { AuthUser } from '@/stores/auth-store'
import { ACCESS, PAGE_AREAS, type AccessArea } from './access-map'
import { allows, ruleForPath } from './sink-permissions'

/**
 * CLIQBOOK has two kinds of staff login (labels, the Team form and the own-bookings scope):
 * - Super admin: the owner (OWNER), sink's admin role (ADMIN-ATTENDANT) and MANAGER (sink's isAdminLike).
 * - Attendant: every other role. Works on their own bookings only (staff id = their user id).
 * A login without a role is the owner (sink's demo and older owner accounts carry none).
 *
 * What each login may see and do is decided per screen from its permissions, as sink-inventory decides
 * (owner bypass → permissions_matrix checklist → on/off flag → role rule): lib/access-map.ts.
 */
export const SUPER_ADMIN_ROLES = ['OWNER', 'ADMIN-ATTENDANT', 'MANAGER'] as const

export const isSuperAdminRole = (role: string | undefined | null) => !role || (SUPER_ADMIN_ROLES as readonly string[]).includes(role.toUpperCase())

/** App areas a route or sidebar link belongs to. */
export type AppArea = 'overview' | 'bookings' | 'calendar' | 'wallet' | 'clients' | 'services' | 'categories' | 'settings' | 'kyc'

/** Each route area → its rule in lib/access-map.ts. */
const AREA_ACCESS: Record<AppArea, AccessArea> = {
  overview: 'overview',
  bookings: 'bookings',
  calendar: 'bookings',
  wallet: 'transactions',
  clients: 'clients',
  services: 'services',
  categories: 'categories',
  settings: 'setup',
  kyc: 'setup',
}

export type Permissions = ReturnType<typeof permissionsFor>

/** Everything the signed-in user may see or do, from the login's role, id and permissions. */
export function permissionsFor(user: Pick<AuthUser, 'id' | 'role' | 'permissions'> | null | undefined) {
  const subject = { role: user?.role, permissions: user?.permissions }
  const can = (area: AccessArea) => allows(ACCESS[area], subject)
  const isSuperAdmin = isSuperAdminRole(user?.role)
  const userId = user?.id === undefined || user?.id === null ? '' : String(user.id)
  return {
    isSuperAdmin,
    isAttendant: !isSuperAdmin,
    userId,
    /**
     * Bookings are narrowed to this staff id (the booking's staff_id) for attendants; empty for admins.
     * An attendant login without an id gets a value nothing matches, so no one else's bookings leak through.
     */
    staffScopeId: isSuperAdmin ? '' : userId || 'unknown-staff',
    /** Overview is the landing page, so it is never refused. */
    canAccess: (area: AppArea) => area === 'overview' || can(AREA_ACCESS[area]),
    /** Whether a route may be opened (PAGE_AREAS; routes without an area are open to every signed-in user). */
    canOpen: (path: string) => { const area = ruleForPath(path, PAGE_AREAS); return area ? can(area) : true },
    canAddBooking: can('addBooking'),
    /** Services: the catalogue and availability tabs (create, edit, delete, opening hours, blocked time). */
    canManageServices: can('manageServices'),
    /** Wallet: balance, withdraw, PIN and payout bank. Without it, the transactions list only. */
    canManageWallet: can('manageWallet'),
    /** Transfer / withdraw (shown with the balance, as in sink). */
    canTransfer: can('manageWallet') && can('transfer'),
    /** Bookings: refunds, reschedule, reassign and cancel. */
    canManageBookings: can('manageBookings'),
    canAddClients: can('addClients'),
    canEditClients: can('editClients'),
    canDeleteClients: can('deleteClients'),
    canExportClients: can('exportClients'),
    /** Setup, KYC, storefront and branches. */
    canManageBusiness: can('setup'),
    canInviteStaff: can('setup') && can('inviteStaff'),
    canManageStaff: can('setup') && can('manageStaff'),
  }
}
