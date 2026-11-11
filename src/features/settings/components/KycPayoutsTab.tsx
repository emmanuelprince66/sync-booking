import { ArrowRight, ShieldCheck, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { fieldBoxClass, fieldLabelClass } from '@/components/ui/Field'
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { useKycPayouts, type KycPayoutsModel } from '../hooks/useKycPayouts'

function ReadOnlyField({ label, value, isLoading }: { label: string; value: string; isLoading?: boolean }) {
  return <div className="min-w-0">
    <span className={fieldLabelClass}>{label}</span>
    <div className={fieldBoxClass}>{isLoading ? <Skeleton className="h-4 w-32"/> : <span className="truncate py-3 text-sm font-bold text-[#405B50]">{value}</span>}</div>
  </div>
}

/** The balance at a glance; withdrawing, transfers, PIN and transactions are on the Wallet page. */
function BalanceSummary({ tab }: { tab: KycPayoutsModel }) {
  if (tab.balanceLoading) return <SkeletonGroup label="Loading balance" className="flex items-center justify-between gap-4 rounded-2xl bg-[#173A2E] p-5">
    <div className="space-y-2"><Skeleton className="h-3 w-24 bg-white/15"/><Skeleton className="h-7 w-36 bg-white/15"/></div>
    <Skeleton className="h-10 w-32 rounded-xl bg-white/15"/>
  </SkeletonGroup>
  return <div className="flex min-w-0 flex-col justify-between gap-4 rounded-2xl bg-[#173A2E] p-5 text-white sm:flex-row sm:items-center">
    <div className="flex min-w-0 items-center gap-3">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/[0.08] text-[#D8FF72]"><Wallet size={20}/></span>
      <div className="min-w-0">
        <p className="text-xs font-bold text-white/55">Wallet balance</p>
        <p className="truncate text-2xl font-black">{tab.balanceError ? '—' : tab.balanceLabel}</p>
        <p className="truncate text-[11px] font-semibold text-white/45">{tab.balanceError ? 'Couldn’t load your balance' : tab.balanceNote}</p>
      </div>
    </div>
    <Button onClick={tab.goToWallet} className="w-full shrink-0 bg-[#D8FF72] text-[#173A2E] shadow-none hover:bg-[#E4FF9A] sm:w-auto">Go to wallet <ArrowRight size={16}/></Button>
  </div>
}

export function KycPayoutsTab() {
  const tab = useKycPayouts()
  return <div className="flex flex-col gap-4">
    <BalanceSummary tab={tab}/>
    <div className="rounded-2xl border border-border bg-white p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-center gap-4">
          <span className={cn('grid h-12 w-12 shrink-0 place-items-center rounded-2xl', tab.verified ? 'bg-[#E2F7E9] text-[#248153]' : 'bg-[#FFF1CB] text-[#946000]')}><ShieldCheck size={22}/></span>
          <div className="min-w-0"><h3 className="font-black text-[#173A2E]">{tab.identityTitle}</h3><p className="mt-1 text-xs font-bold text-[#81948B]">{tab.identityNote}</p></div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span className={cn('w-fit rounded-full px-3 py-1.5 text-xs font-black', tab.verified ? 'bg-[#E2F7E9] text-[#157443]' : 'bg-[#FFF1CB] text-[#946000]')}>{tab.identityBadge}</span>
          <Button variant="outline" onClick={tab.goToKyc} className="h-9 rounded-lg px-3 text-xs"><ShieldCheck size={14}/> {tab.kycActionLabel}</Button>
        </div>
      </div>
      <div className="mt-6 border-t border-border pt-5">
        <ReadOnlyField label="Payout bank" value={tab.payoutBank} isLoading={tab.payoutBankLoading}/>
        <p className="mt-2 text-[11px] font-semibold text-[#8A9C93]">Withdraw your balance to this account from the Wallet page.</p>
      </div>
    </div>
  </div>
}
