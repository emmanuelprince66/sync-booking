import { Building2, CalendarDays, CheckCircle2, Clock3, Home, Settings, Sparkles, Store, UserCog, Users, Wallet, type LucideIcon } from 'lucide-react'
import { paths } from '@/routes/paths'

export type NavItem = { id: string; label: string; to: string; icon: LucideIcon }

export const navItems: NavItem[] = [
  { id: 'overview', label: 'Overview', to: paths.overview, icon: Home },
  { id: 'calendar', label: 'Calendar', to: paths.calendar, icon: CalendarDays },
  { id: 'bookings', label: 'Bookings', to: paths.bookings, icon: CheckCircle2 },
  { id: 'wallet', label: 'Wallet', to: paths.wallet, icon: Wallet },
  { id: 'clients', label: 'Clients', to: paths.clients, icon: Users },
  { id: 'services', label: 'Services', to: paths.services, icon: Sparkles },
  { id: 'availability', label: 'Availability', to: paths.availability, icon: Clock3 },
  { id: 'team', label: 'Team', to: paths.team, icon: UserCog },
  { id: 'branches', label: 'Branches', to: paths.branches, icon: Building2 },
  { id: 'storefront', label: 'Storefront', to: paths.storefront, icon: Store },
  { id: 'settings', label: 'Business setup', to: paths.settings, icon: Settings },
]
