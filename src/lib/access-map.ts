import type { AccessRule } from './sink-permissions'

/**
 * CLIQBOOK screens and actions → sink-inventory's permission keys.
 * Same structure in SyncShip, CLIQBOOK and Payments (lib/access-map.ts); the logic is lib/sink-permissions.ts.
 *
 * How a rule is read (sink's order): the owner can do everything → the login's checklist
 * (`permissions_matrix`, "module:action", any one pair enough) → sink's on/off flag when the login has
 * flags but no checklist → the role rule (`adminLike` = OWNER / ADMIN-ATTENDANT / MANAGER).
 *
 * Role rules are the owner's stated attendant defaults (an attendant with the sink role defaults gets the
 * same). Where sink's own role rule differs it says so: those are the sink differences to confirm.
 */
export const ACCESS = {
  // ─── Overview ───────────────────────────────────────────────────────────
  /** Overview. sink /overview → dashboard:view. Not route-gated: it is where a refused page lands. */
  overview: { matrix: ['dashboard:view'], roles: 'everyone' },

  // ─── Bookings (sink: Fulfillment → Bookings) ────────────────────────────
  /** Bookings page and Calendar. sink /bookings → bookings:view. sink's role rule: OWNER / ADMIN-ATTENDANT only. */
  bookings: { matrix: ['bookings:view'], roles: 'everyone' },
  /** New booking. Nearest sink key: bookings:create. */
  addBooking: { matrix: ['bookings:create'], roles: 'everyone' },
  /** Refunds, reschedule, reassign, cancel. sink RefundsPage/BookingDetails → isOwner || isAdminAttendant; checklist bookings:edit or bookings:cancel. */
  manageBookings: { matrix: ['bookings:edit', 'bookings:cancel'], roles: 'adminLike' },

  // ─── Clients (sink: Customers) ──────────────────────────────────────────
  /** Clients page. sink /customers → customers:view. sink's role rule: OWNER / ADMIN-ATTENDANT / ACCOUNTANT. */
  clients: { matrix: ['customers:view'], roles: 'everyone' },
  /** Add a client. sink Customers → customers:create, fallback true. */
  addClients: { matrix: ['customers:create'], roles: 'everyone' },
  /** Edit a client (details, notes). sink Contact → customers:edit. Role rule kept at admins (CLIQBOOK's default); sink's fallback is true. */
  editClients: { matrix: ['customers:edit'], roles: 'adminLike' },
  /** Delete a client. sink Contact → customers:delete, fallback isAdminLike. */
  deleteClients: { matrix: ['customers:delete'], roles: 'adminLike' },
  /** Export the client list. No sink key; closest is customers:edit with the admin role rule. */
  exportClients: { matrix: ['customers:edit'], roles: 'adminLike' },

  // ─── Services (sink: booking services / Products) ──────────────────────
  /** Services page (own service history for attendants). Nearest sink key: bookings:view. */
  services: { matrix: ['bookings:view'], roles: 'everyone' },
  /** Catalogue and availability tabs: create, edit, delete services, opening hours, blocked time. sink products:create / products:edit. */
  manageServices: { matrix: ['products:create', 'products:edit'], roles: 'adminLike' },
  /** Service categories. sink /categories → products:edit. */
  categories: { matrix: ['products:edit'], roles: 'adminLike' },

  // ─── Wallet (sink: Transactions) ────────────────────────────────────────
  /** Wallet page and its transactions list. sink /transactions → banking:view or sales:view (flag view_transactions). */
  transactions: { matrix: ['banking:view', 'sales:view'], flag: 'view_transactions', roles: 'everyone' },
  /** Balance, withdraw, PIN, payout bank. sink Transactions → manage_bank_details (banking:manage). */
  manageWallet: { flag: 'manage_bank_details', roles: 'adminLike' },
  /** Transfer / withdraw (inside the balance banner). sink Transactions → can_initiate_expense_transfer (expenses:transfer). */
  transfer: { flag: 'can_initiate_expense_transfer', roles: 'adminLike' },

  // ─── Setup (sink: Store / Operations / Settings) ────────────────────────
  /** Setup (KYC, payments, domain, storefront, branches) and KYC. sink /store-info, /operations … → settings:view. */
  setup: { matrix: ['settings:view'], roles: 'adminLike' },
  /** Team tab: add, edit, remove staff. sink Settings → staff:view / staff:invite / staff:manage_roles (fallback isAdminLike). */
  team: { matrix: ['staff:view'], roles: 'adminLike' },
  inviteStaff: { matrix: ['staff:invite'], roles: 'adminLike' },
  manageStaff: { matrix: ['staff:manage_roles'], roles: 'adminLike' },
} as const satisfies Record<string, AccessRule>

export type AccessArea = keyof typeof ACCESS

/** Routes → the area that opens them. Most specific first: the first prefix that matches decides. */
export const PAGE_AREAS: readonly (readonly [string, AccessArea])[] = [
  ['/services/categories', 'categories'],
  ['/services', 'services'],
  ['/calendar', 'bookings'],
  ['/bookings', 'bookings'],
  ['/clients', 'clients'],
  ['/wallet', 'transactions'],
  ['/storefront', 'setup'],
  ['/settings', 'setup'],
  ['/team', 'setup'],
  ['/branches', 'setup'],
  ['/kyc', 'setup'],
]
