import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { Check, Crown, Lock, Minus, X } from 'lucide-react'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { BILLING_PERIODS, BOOKING_PLAN_FEATURES, useActivePlan, useBranchSubscription, usePlans, useSubscribe, type BillingPeriod, type Plan, type PlanSummary } from '@/api/plan'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/misc'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { usePermissions } from '@/hooks/usePermissions'
import { cn } from '@/lib/cn'

/** sink's display: -1 → ∞, missing → —, anything else as the number it is (0 stays 0). */
const countLabel = (value: number | null | undefined) => (value === null || value === undefined ? '—' : value < 0 ? '∞' : value.toLocaleString())

/** A plan-card value: numbers as countLabel, a real yes/no as such, missing → —. */
const planValueLabel = (value: number | boolean | undefined) => (typeof value === 'boolean' ? (value ? 'Yes' : 'No') : countLabel(value))

/** active_plan's amount as sink shows it: naira, always two decimals ("₦0.00"). */
const nairaLabel = (amount: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount || 0)

const DURATION_LABELS: Record<string, string> = { ANNUAL: 'annual', MONTHLY: 'monthly', QUARTERLY: 'quarterly', BIANNUAL: '6 months' }
const durationLabel = (duration: string) => DURATION_LABELS[duration.toUpperCase()] ?? duration.toLowerCase()

const PLANS_LIST_ID = 'plan-tab-plans'

type Row = [label: string, value: string]
type UsageRow = { label: string; used: number | null; limit: number | null }

/** The data sink's Premium screen shows, straight from active_plan, in CLIQBOOK's own layout. */
function CurrentPlanCard({ summary, name }: { summary: PlanSummary; name: string }) {
  const hasBookings = summary.bookingsLimit !== null
  const features: Row[] = [
    ['Users', countLabel(summary.customerCount)],
    ['Businesses', countLabel(summary.businesses ?? 0)],
    ['Attendants', countLabel(summary.attendants ?? 0)],
    ['Inventory limit', countLabel(summary.inventoryLimit)],
    ['Customer limit', countLabel(summary.customerLimit)],
  ]
  if (hasBookings) features.push(['Bookings limit', countLabel(summary.bookingsLimit)])
  const usage: UsageRow[] = [
    { label: 'Inventory used', used: summary.inventoryCount, limit: summary.inventoryLimit },
    { label: 'Customers added', used: summary.customerCount, limit: summary.customerLimit },
  ]
  if (hasBookings) usage.push({ label: 'Bookings', used: summary.bookingsCount ?? 0, limit: summary.bookingsLimit })
  const duration = summary.duration ? durationLabel(summary.duration) : ''

  return <div className="rounded-2xl border border-border bg-white p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#173A2E] text-[#D8FF72]"><Crown size={20}/></span>
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-bold text-[#81948B]">Current plan<span className="rounded-full bg-[#EDF4EF] px-2 py-0.5 text-[10px] font-black text-[#24764F]">Active</span></p>
          <h3 className="break-words text-xl font-black text-[#173A2E]">{nairaLabel(summary.amount)}{duration && <span className="text-sm font-bold text-[#81948B]"> / {duration}</span>}</h3>
          {name && <p className="truncate text-xs font-bold text-[#329661]">{name}</p>}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[#EDF4EF] px-3 py-1.5 text-xs font-black text-[#24764F]">Renewal date: {summary.endDate || '—'}</span>
        <Button variant="outline" className="h-9" onClick={() => document.getElementById(PLANS_LIST_ID)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>View plans</Button>
      </div>
    </div>

    <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-2">
      <div className="min-w-0">
        <p className="text-xs font-black text-[#173A2E]">Features</p>
        <div className="mt-3 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2 sm:grid-cols-3">{features.map(([label, value]) => <div key={label} className="min-w-0 rounded-xl bg-[#F6F9F7] p-3">
          <p className="truncate text-[11px] font-bold text-[#81948B]">{label}</p>
          <p className="mt-0.5 break-words text-base font-black text-[#173A2E]">{value}</p>
        </div>)}</div>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-black text-[#173A2E]">Usage</p>
        <div className="mt-3 flex flex-col gap-2">{usage.map(({ label, used, limit }) => {
          const pct = used !== null && limit !== null && limit > 0 ? Math.min(100, (used / limit) * 100) : 0
          return <div key={label} className="min-w-0 rounded-xl bg-[#F6F9F7] p-3">
            <div className="flex items-baseline justify-between gap-2"><p className="truncate text-[11px] font-bold text-[#81948B]">{label}</p><p className="shrink-0 text-sm font-black text-[#173A2E]">{countLabel(used)} / {countLabel(limit)}</p></div>
            <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-[#DDE8E1]"><span className={cn('block h-full rounded-full', pct >= 100 ? 'bg-[#C72D34]' : pct >= 80 ? 'bg-[#D99A24]' : 'bg-[#329661]')} style={{ width: `${pct}%` }}/></span>
          </div>
        })}</div>
      </div>
    </div>
  </div>
}

/** Setup → Plan & billing: the current plan as sink-inventory shows it, every tier side by side, and upgrading. */
export function PlanTab() {
  const [searchParams] = useSearchParams()
  const domainUpgrade = searchParams.get('upgrade') === 'custom-domain'
  const money = useFormatMoney()
  const plans = usePlans()
  const active = useActivePlan()
  const branch = useBranchSubscription()
  const subscribe = useSubscribe()
  // Buying a plan is for the owner and admins (Super admin roles); everyone else can still see the tiers.
  const { isSuperAdmin: canSubscribe } = usePermissions()
  const [period, setPeriod] = useState<BillingPeriod>('MONTHLY')
  const [choosing, setChoosing] = useState('')
  const priceKey = BILLING_PERIODS.find(item => item.value === period)?.priceKey ?? 'monthly'
  const current = active.data
  const allPlans = plans.data ?? []
  const syncPlusIndex = allPlans.findIndex(plan => plan.name.toLowerCase().replace(/[^a-z0-9]/g, '') === 'syncplus')
  const customDomainPlans = syncPlusIndex >= 0
    ? allPlans.slice(syncPlusIndex)
    : allPlans.filter(plan => plan.limits.custom_domain === true || (typeof plan.limits.custom_domain === 'number' && plan.limits.custom_domain > 0))
  const visiblePlans = domainUpgrade ? customDomainPlans : allPlans

  const choose = (plan: Plan) => {
    setChoosing(plan.id)
    subscribe.mutate({ planId: plan.id, period, businessId: branch.planBusinessId }, {
      onSuccess: ({ paymentUrl }) => { if (paymentUrl) window.location.href = paymentUrl; else toast.success(`${plan.name} selected`) },
      onError: error => toast.error(errorMessage(error, 'Could not start the subscription.')),
      onSettled: () => setChoosing(''),
    })
  }

  return <div className="flex flex-col gap-4">
    {branch.locked && <div className="flex items-start gap-3 rounded-2xl border border-[#F0D78C] bg-[#FFF8E1] p-4"><Lock size={18} className="mt-0.5 shrink-0 text-[#8A6A12]"/><div><p className="text-sm font-black text-[#5E4708]">{branch.branchName || 'This branch'} needs its own plan</p><p className="mt-1 text-xs font-semibold text-[#8A6A12]">Only your first business is covered by your account plan. {canSubscribe ? 'Choose a plan below to unlock this branch.' : 'Ask your business owner to choose a plan for it.'}</p></div></div>}

    {active.isError ? <div className="rounded-2xl border border-border bg-white p-6"><ErrorState title="We couldn’t load your plan" onRetry={() => void active.refetch()}/></div>
      : active.isLoading || !current ? <div className="h-72 animate-pulse rounded-2xl bg-[#F1F5F2]"/>
        : <CurrentPlanCard summary={current.summary} name={current.name}/>}

    <div id={PLANS_LIST_ID} className="scroll-mt-4 rounded-2xl border border-border bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h3 className="font-black text-[#173A2E]">Plans</h3><p className="mt-1 text-xs font-semibold text-[#879A91]">{domainUpgrade ? 'Sync Plus and higher plans include custom domains.' : canSubscribe ? 'One subscription covers all your Sync360 apps.' : 'Ask your business owner to change the plan.'}</p></div>
        <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-full bg-[#EDF4EF] p-1" role="tablist" aria-label="Billing period">{BILLING_PERIODS.map(item => <button key={item.value} type="button" role="tab" aria-selected={period === item.value} onClick={() => setPeriod(item.value)} className={cn('shrink-0 rounded-full px-4 py-2 text-xs font-black transition', period === item.value ? 'bg-[#173A2E] text-white' : 'text-[#24764F]')}>{item.label}</button>)}</div>
      </div>
      {plans.isError ? <div className="mt-5"><ErrorState title="We couldn’t load the plans" onRetry={() => void plans.refetch()}/></div>
        : plans.isLoading ? <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <div key={index} className="h-80 animate-pulse rounded-2xl bg-[#F1F5F2]"/>)}</div>
          : visiblePlans.length === 0 ? <p className="mt-5 rounded-xl border border-dashed border-border p-6 text-center text-xs font-semibold text-[#71867C]">No plans that include custom domains are currently available.</p>
          : <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 xl:grid-cols-3">{visiblePlans.map(plan => {
            const isCurrent = Boolean(current?.name) && plan.name.toLowerCase() === current?.name.toLowerCase()
            const price = plan.prices[priceKey] ?? 0
            return <div key={plan.id} className={cn('flex min-w-0 flex-col rounded-2xl border p-5', isCurrent ? 'border-[#329661] bg-[#F1FAF4]' : 'border-border')}>
              <div className="flex items-center justify-between gap-2"><b className="truncate text-sm font-black text-[#173A2E]">{plan.name}</b>{isCurrent && <span className="shrink-0 rounded-full bg-[#329661] px-2 py-0.5 text-[10px] font-black text-white">Current</span>}</div>
              <p className="mt-3 text-2xl font-black text-[#173A2E]">{price > 0 ? money(price) : 'Free'}<span className="text-xs font-bold text-[#81948B]">{price > 0 ? ` / ${BILLING_PERIODS.find(item => item.value === period)?.label.toLowerCase()}` : ''}</span></p>
              <ul className="mt-4 flex flex-1 flex-col gap-2">{BOOKING_PLAN_FEATURES.map(({ field, label, unit }) => {
                const value = plan.limits[field]
                const missing = value === undefined
                const off = value === false || value === 0
                return <li key={field} className="flex items-center gap-2 text-xs font-semibold text-[#405B50]">
                  {missing ? <Minus size={14} className="shrink-0 text-[#C3D0C9]"/> : off ? <X size={14} className="shrink-0 text-[#C3D0C9]"/> : <Check size={14} className="shrink-0 text-[#329661]"/>}
                  <span className={cn('min-w-0', (off || missing) && 'text-[#A9B7B0]')}>{label}{unit ? ` ${unit}` : ''}: <b className="font-black">{planValueLabel(value)}</b></span>
                </li>
              })}</ul>
              {canSubscribe && <Button onClick={() => choose(plan)} disabled={(isCurrent && !branch.locked) || price <= 0} loading={choosing === plan.id} className="mt-5 w-full">{isCurrent && !branch.locked ? 'Your plan' : price <= 0 ? 'Free plan' : `Choose ${plan.name}`}</Button>}
            </div>
          })}</div>}
    </div>
  </div>
}
