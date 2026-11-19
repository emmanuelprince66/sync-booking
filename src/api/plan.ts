import { useMutation, useQuery } from '@tanstack/react-query'
import { apiRequest, mockDelay } from '@/lib/api-client'
import { useCurrentBusiness } from './business'
import { asRecord, isLive, listFrom, num, str, type UnknownRecord } from './http'

/**
 * Plans, as sink-inventory's Premium / Plan pages (its /api/premium proxies pass these through as-is).
 * One subscription per account, the same fields across products; CLIQBOOK reads the ones it needs.
 *  GET  user/plans/?page=1&limit=15      { total, pages, results: [{ id, name, code, monthly, quarterly, biannually,
 *                                        annually, no_of_attendants, no_of_business, inventory_count,
 *                                        customers_count, … }] }  (-1 = unlimited)
 *  GET  user/active_plan/?business_id=   flat: { plan_id, start_date, end_date, amount, duration,
 *                                        inventory_count, inventory_limit, customer_count, customer_limit }
 *                                        (+ bookings_count / bookings_limit / attendants / business_count /
 *                                        custom_domain_allowed where the backend sends them). business_id only
 *                                        for a branch billed on its own.
 *  POST user/subscribe/                  { plan, duration: MONTHLY|QUARTERLY|BIANNUAL|ANNUAL, business_id? } → { payment_url }
 * A branch that isn't the founding one needs its own subscription (business.is_founding / is_subscribed).
 */

export type PlanField = 'no_of_bookings' | 'no_of_attendants' | 'no_of_business' | 'customers_count' | 'inventory_count' | 'custom_domain'
export type BillingPeriod = 'MONTHLY' | 'QUARTERLY' | 'BIANNUAL' | 'ANNUAL'

export const BILLING_PERIODS: { value: BillingPeriod; label: string; priceKey: string; months: number }[] = [
  { value: 'MONTHLY', label: 'Monthly', priceKey: 'monthly', months: 1 },
  { value: 'QUARTERLY', label: 'Quarterly', priceKey: 'quarterly', months: 3 },
  { value: 'BIANNUAL', label: '6 months', priceKey: 'biannually', months: 6 },
  { value: 'ANNUAL', label: 'Yearly', priceKey: 'annually', months: 12 },
]

/** What CLIQBOOK shows per plan, in the backend's wording of the matrix. */
export const BOOKING_PLAN_FEATURES: { field: PlanField; label: string; unit?: string }[] = [
  { field: 'no_of_bookings', label: 'Bookings', unit: 'a month' },
  { field: 'no_of_attendants', label: 'Attendants' },
  { field: 'no_of_business', label: 'Branches' },
  { field: 'inventory_count', label: 'Services' },
  { field: 'customers_count', label: 'Client records' },
  { field: 'custom_domain', label: 'Custom domain' },
]

export type PlanLimits = Partial<Record<PlanField, number | boolean>>
export type Plan = { raw?: UnknownRecord; id: string; name: string; prices: Record<string, number>; limits: PlanLimits }

/** sink's Premium screen, field for field: what active_plan reports, shown as-is (-1 = ∞, missing = not shown). */
export type PlanSummary = {
  amount: number
  duration: string
  startDate: string
  endDate: string
  businesses: number | null
  attendants: number | null
  inventoryCount: number | null
  inventoryLimit: number | null
  customerCount: number | null
  customerLimit: number | null
  bookingsCount: number | null
  bookingsLimit: number | null
}
const maybeNum = (value: unknown) => (value === undefined || value === null || value === '' ? null : num(value))
export const summaryOf = (root: UnknownRecord): PlanSummary => ({
  amount: num(root.amount),
  duration: str(root.duration),
  startDate: str(root.start_date),
  endDate: str(root.end_date),
  businesses: maybeNum(root.business_count),
  attendants: maybeNum(root.attendants),
  inventoryCount: maybeNum(root.inventory_count),
  inventoryLimit: maybeNum(root.inventory_limit),
  customerCount: maybeNum(root.customer_count),
  customerLimit: maybeNum(root.customer_limit),
  bookingsCount: maybeNum(root.bookings_count),
  bookingsLimit: maybeNum(root.bookings_limit),
})

export type ActivePlan = {
  name: string
  /** The fields sink's Premium screen shows, straight from active_plan. */
  summary: PlanSummary
  endsAt: string
  amount: number
  duration: string
  limits: PlanLimits
  /** Live usage the backend reports. */
  usage: Partial<Record<PlanField, number>>
  customDomainAllowed: boolean | null
}

const mapPlan = (value: unknown): Plan => {
  const p = asRecord(value)
  const limits: PlanLimits = {}
  for (const { field } of BOOKING_PLAN_FEATURES) {
    const v = p[field]
    if (v !== undefined && v !== null && v !== '') limits[field] = typeof v === 'boolean' ? v : num(v)
  }
  return { raw: p, id: str(p.id), name: str(p.name), prices: Object.fromEntries(BILLING_PERIODS.map(period => [period.priceKey, num(p[period.priceKey])])), limits }
}

/** active_plan's own limits (only the ones it sends) and usage, by the real field names. */
const mapActivePlan = (value: unknown): ActivePlan => {
  const root = asRecord(value)
  const summary = summaryOf(root)
  const limits: PlanLimits = {}
  if (summary.inventoryLimit !== null) limits.inventory_count = summary.inventoryLimit
  if (summary.customerLimit !== null) limits.customers_count = summary.customerLimit
  if (summary.bookingsLimit !== null) limits.no_of_bookings = summary.bookingsLimit
  if (typeof root.custom_domain_allowed === 'boolean') limits.custom_domain = root.custom_domain_allowed
  const usage: ActivePlan['usage'] = {}
  if (summary.inventoryCount !== null) usage.inventory_count = summary.inventoryCount
  if (summary.customerCount !== null) usage.customers_count = summary.customerCount
  if (summary.bookingsCount !== null) usage.no_of_bookings = summary.bookingsCount
  if (summary.attendants !== null) usage.no_of_attendants = summary.attendants
  if (summary.businesses !== null) usage.no_of_business = summary.businesses
  return {
    name: '',
    summary,
    endsAt: summary.endDate,
    amount: summary.amount,
    duration: summary.duration.toUpperCase(),
    limits,
    usage,
    customDomainAllowed: typeof root.custom_domain_allowed === 'boolean' ? root.custom_domain_allowed : null,
  }
}

/** The live plans list (user/plans/, Nov 2026), used as sample data in mock mode. */
const SAMPLE_PLANS: Plan[] = [
  { id: '5', name: 'FREE', prices: { monthly: 0, quarterly: 0, biannually: 0, annually: 0 }, limits: { no_of_attendants: 0, no_of_business: 1, inventory_count: 5, customers_count: 50 }, raw: { inventory_count: 5, customers_count: 50 } },
  { id: '2', name: 'STARTER', prices: { monthly: 3000, quarterly: 9000, biannually: 15000, annually: 30000 }, limits: { no_of_attendants: 0, no_of_business: 1, inventory_count: 70, customers_count: 100 }, raw: { inventory_count: 70, customers_count: 100 } },
  { id: '3', name: 'SYNC-PLUS', prices: { monthly: 5000, quarterly: 15000, biannually: 30000, annually: 50000 }, limits: { no_of_attendants: 10, no_of_business: 1, inventory_count: 350, customers_count: 300 }, raw: { inventory_count: 350, customers_count: 300 } },
  { id: '4', name: 'SYNC-PRO', prices: { monthly: 13000, quarterly: 39000, biannually: 78000, annually: 130000 }, limits: { no_of_attendants: 7, no_of_business: 2, inventory_count: 6000, customers_count: -1 }, raw: { inventory_count: 6000, customers_count: -1 } },
]

/** A non-founding branch is billed on its own (sink's branchSubscription). */
export const useBranchSubscription = () => {
  const business = useCurrentBusiness()
  const raw = business.data?.raw ?? {}
  const separatelyBilled = raw.is_founding === false
  return {
    planBusinessId: separatelyBilled ? str(raw.id) || business.data?.id || null : null,
    locked: separatelyBilled && raw.is_subscribed !== true,
    branchName: business.data?.name ?? '',
  }
}

export const usePlans = () => useQuery({
  queryKey: ['plans'],
  queryFn: async () => (isLive() ? listFrom(await apiRequest<unknown>('user/plans/?page=1&limit=15'), ['results', 'data', 'results.data']).map(mapPlan) : mockDelay(SAMPLE_PLANS)),
  staleTime: 10 * 60 * 1000,
})

const useActivePlanRaw = () => {
  const { planBusinessId } = useBranchSubscription()
  return useQuery({
    queryKey: ['active-plan', planBusinessId ?? 'founding'],
    queryFn: async () => (isLive()
      ? mapActivePlan(await apiRequest<unknown>(`user/active_plan/${planBusinessId ? `?business_id=${encodeURIComponent(planBusinessId)}` : ''}`))
      : mockDelay(mapActivePlan({ plan_id: 'sample', start_date: '2025-03-17', end_date: '2036-03-24', amount: 0, duration: 'ANNUAL', inventory_count: 420, inventory_limit: 6000, customer_count: 1, customer_limit: -1 }))),
    retry: (count, error) => ![401, 404].includes((error as { status?: number })?.status ?? 0) && count < 1,
  })
}

/**
 * The tier the business is on. active_plan has no plan name or number (plan_id is the subscription's id)
 * and the amount can be ₦0 on a comped plan, so the price says nothing: the tier is the one whose
 * inventory_count and customers_count equal active_plan's inventory_limit and customer_limit. No match → none.
 */
export const matchPlan = (active: ActivePlan, plans: Plan[]) => {
  const { inventoryLimit, customerLimit } = active.summary
  if (inventoryLimit === null || customerLimit === null) return undefined
  const found = plans.filter(plan => plan.raw && num(plan.raw.inventory_count) === inventoryLimit && num(plan.raw.customers_count) === customerLimit)
  return found.length === 1 ? found[0] : undefined
}

export const useActivePlan = () => {
  const query = useActivePlanRaw()
  const plans = usePlans()
  const raw = query.data
  const tier = raw ? matchPlan(raw, plans.data ?? []) : undefined
  const data: ActivePlan | undefined = raw && { ...raw, name: tier?.name || raw.name, limits: { ...(tier?.limits ?? {}), ...raw.limits } }
  return { data, isLoading: query.isLoading, isError: query.isError, error: query.error, refetch: query.refetch }
}

/** Whether something is still allowed on this plan: a number limit (-1 = unlimited) against live usage, or a yes/no. */
export const usePlanGate = () => {
  const plan = useActivePlan()
  const branch = useBranchSubscription()
  const data = plan.data
  const limitOf = (field: PlanField) => data?.limits[field]
  return {
    loading: plan.isLoading,
    planName: data?.name ?? '',
    branchLocked: branch.locked,
    /** True once usage reaches a numeric limit; never blocks when either number is unknown. */
    atLimit: (field: Exclude<PlanField, 'custom_domain'>, current?: number) => {
      const limit = limitOf(field)
      if (typeof limit !== 'number' || limit < 0) return false
      const used = current ?? data?.usage[field]
      return typeof used === 'number' && used >= limit
    },
    limit: limitOf,
    /** Live usage the backend reported, if any. */
    used: (field: Exclude<PlanField, 'custom_domain'>) => data?.usage[field],
    /** Locked only on an explicit no (sink: custom_domain_allowed === false) or a branch without its own plan. */
    customDomain: !branch.locked && (data?.customDomainAllowed ?? limitOf('custom_domain')) !== false,
  }
}

export const useSubscribe = () => useMutation({
  mutationFn: async ({ planId, period, businessId }: { planId: string; period: BillingPeriod; businessId: string | null }) => {
    if (!isLive()) return mockDelay({ paymentUrl: '' })
    const raw = asRecord(await apiRequest<unknown>('user/subscribe/', { method: 'POST', body: { plan: Number(planId) || planId, duration: period, ...(businessId ? { business_id: businessId } : {}) } }))
    const paymentUrl = str(asRecord(raw.data).payment_url) || str(raw.payment_url)
    if (!paymentUrl) throw new Error('No payment link came back. Please try again.')
    return { paymentUrl }
  },
})
