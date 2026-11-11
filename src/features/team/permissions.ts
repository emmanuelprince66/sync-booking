import type { PermissionsMatrix } from '@/api/attendants'

/**
 * Wording for sink-inventory's permission modules and actions. The keys are the
 * backend's (same as sink); only the labels are worded for a booking business.
 */
const MODULE_LABELS: Record<string, string> = {
  dashboard: 'Overview',
  reports: 'Reports',
  inventory: 'Inventory',
  products: 'Products & services',
  sales: 'Sales & checkout',
  orders: 'Orders',
  bookings: 'Bookings',
  suppliers: 'Suppliers',
  expenses: 'Expenses',
  customers: 'Clients',
  banking: 'Banking & payouts',
  campaigns: 'Campaigns',
  loyalty: 'Loyalty',
  staff: 'Team',
  attendance: 'Attendance',
  settings: 'Business setup',
}

const ACTION_LABELS: Record<string, string> = {
  'inventory.restock': 'Restock',
  'inventory.transfer': 'Transfer stock',
  'inventory.return': 'Log supplier returns',
  'inventory.damage': 'Write off damaged goods',
  'inventory.production': 'Move to production',
  'inventory.raw_material': 'Raw materials',
  'inventory.manage_branches': 'Manage across branches',
  'products.edit': 'Edit, including prices and discounts',
  'products.sell_watchlist': 'Sell watchlist items',
  'sales.create': 'Take payments',
  'sales.discount': 'Give manual discounts',
  'sales.reverse': 'Reverse sales',
  'sales.presale': 'Create presales',
  'sales.dispense': 'Dispense drugs',
  'sales.view_prescriptions': 'View prescriptions',
  'bookings.create': 'Create bookings',
  'bookings.edit': 'Reschedule and update bookings',
  'bookings.cancel': 'Cancel bookings',
  'customers.create': 'Add clients',
  'customers.edit': 'Edit clients',
  'expenses.create': 'Record expenses',
  'expenses.transfer': 'Start expense transfers',
  'expenses.approve': 'Approve expenses',
  'staff.invite': 'Add team members',
  'staff.manage_roles': 'Change roles and permissions',
}

const titleCase = (key: string) => key.replace(/_/g, ' ').replace(/^\w/, first => first.toUpperCase())

export const moduleLabel = (module: string) => MODULE_LABELS[module] ?? titleCase(module)
export const actionLabel = (module: string, action: string) => ACTION_LABELS[`${module}.${action}`] ?? titleCase(action)

const sorted = (list: string[] = []) => [...list].sort().join()

/** Same actions, whatever order they're listed in. */
export const sameActions = (a: string[] = [], b: string[] = []) => sorted(a) === sorted(b)

/** Same permissions, whatever order they're listed in. */
export const sameMatrix = (a: PermissionsMatrix, b: PermissionsMatrix) =>
  [...new Set([...Object.keys(a), ...Object.keys(b)])].every(module => sameActions(a[module], b[module]))
