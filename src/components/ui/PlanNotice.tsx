import { ArrowRight, Crown, Lock } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { usePermissions } from '@/hooks/usePermissions'
import { cn } from '@/lib/cn'
import { setupPath } from '@/routes/paths'

const planLink = 'inline-flex shrink-0 items-center gap-1 text-xs font-black text-[#24764F] underline-offset-2 hover:text-[#173A2E] hover:underline'

/** Link to Setup → Plan & billing for logins that can open Setup; others are asked to reach the owner. */
function UpgradeAction({ label = 'See plans' }: { label?: string }) {
  const { canManageBusiness } = usePermissions()
  return canManageBusiness
    ? <Link to={setupPath('plan')} className={planLink}>{label} <ArrowRight size={13}/></Link>
    : <span className="text-xs font-bold text-[#8A6A12]">Ask your business owner to upgrade.</span>
}

/** A slim note under an action that the plan has run out of, e.g. "You’ve used all 30 bookings this month." */
export function PlanLimitNote({ children, className }: { children: ReactNode; className?: string }) {
  return <div role="status" className={cn('flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-[#F0D78C] bg-[#FFF8E1] px-3 py-2.5', className)}>
    <span className="flex min-w-0 flex-1 items-center gap-2 text-xs font-bold text-[#5E4708]"><Crown size={14} className="shrink-0 text-[#8A6A12]"/><span className="min-w-0">{children}</span></span>
    <UpgradeAction label="Upgrade"/>
  </div>
}

/** A feature the current plan doesn't include (custom domain). */
export function PlanLockedCard({ title, text, className }: { title: string; text: string; className?: string }) {
  return <div className={cn('flex flex-col gap-3 rounded-2xl bg-[#F4F8F5] p-4 sm:flex-row sm:items-center', className)}>
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#173A2E] text-[#D8FF72]"><Lock size={17}/></span>
    <div className="min-w-0 flex-1"><p className="text-sm font-black text-[#173A2E]">{title}</p><p className="mt-0.5 text-xs font-semibold leading-relaxed text-[#71867C]">{text}</p></div>
    <UpgradeAction label="Upgrade plan"/>
  </div>
}

/** Top of the main content when the open branch isn't the founding one and has no plan of its own. */
export function BranchLockBanner({ branchName }: { branchName: string }) {
  return <div role="status" className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-[#F0D78C] bg-[#FFF8E1] px-5 py-2.5 md:px-8">
    <span className="flex min-w-0 flex-1 items-center gap-2 text-xs font-bold text-[#5E4708]"><Lock size={14} className="shrink-0 text-[#8A6A12]"/><span className="min-w-0"><b className="font-black">{branchName || 'This branch'}</b> needs its own plan. Only your first business is covered by your account plan.</span></span>
    <UpgradeAction label="Choose a plan"/>
  </div>
}
