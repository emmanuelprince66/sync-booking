import { CheckCircle2, Home, Settings, Sparkles, Users, Wallet, type LucideIcon } from 'lucide-react'
import type { AppArea } from '@/lib/permissions'
import { paths } from '@/routes/paths'

/** `id` is also the app area the link opens, so the sidebar can leave out what a role can't use. */
export type NavItem = { id: AppArea; label: string; to: string; icon: LucideIcon }

/**
 * The owner's sidebar: exactly these six. Moved out of it, routes kept:
 * - Calendar: reached from Overview's mini calendar (/calendar?date=…). To restore the link, add back
 *   `{ id: 'calendar', label: 'Calendar', to: paths.calendar, icon: CalendarDays }` after Overview.
 * - Availability: a tab of Services (/availability redirects there).
 * - Storefront, Team, Branches: tabs of Setup (/storefront, /team, /branches redirect there).
 */
export const navItems: NavItem[] = [
  { id: 'overview', label: 'Overview', to: paths.overview, icon: Home },
  { id: 'bookings', label: 'Bookings', to: paths.bookings, icon: CheckCircle2 },
  { id: 'wallet', label: 'Wallet', to: paths.wallet, icon: Wallet },
  { id: 'clients', label: 'Clients', to: paths.clients, icon: Users },
  { id: 'services', label: 'Services', to: paths.services, icon: Sparkles },
  { id: 'settings', label: 'Setup', to: paths.settings, icon: Settings },
]
