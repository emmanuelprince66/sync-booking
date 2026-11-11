import { ArrowDownLeft, ArrowUpRight, Banknote, Send, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { fieldBoxClass, fieldLabelClass } from '@/components/ui/Field'
import { ErrorState } from '@/components/ui/misc'
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { useKycPayouts } from '../hooks/useKycPayouts'
import { TransferModal } from './wallet/TransferModal'
import { WalletTransactions } from './wallet/WalletTransactions'

function ReadOnlyField({ label, value, isLoading }: { label: string; value: string; isLoading?: boolean }) {
  return <div className="min-w-0">
    <span className={fieldLabelClass}>{label}</span>
    <div className={fieldBoxClass}>{isLoading ? <Skeleton className="h-4 w-32"/> : <span className="truncate py-3 text-sm font-bold text-[#405B50]">{value}</span>}</div>
  </div>
}

function Flow({ icon, label, value }: { icon: 'in' | 'out'; label: string; value: string }) {
  return <div className="min-w-0 rounded-xl bg-white/[0.07] px-3 py-2.5">
    <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-white/55">{icon === 'in' ? <ArrowDownLeft size={13} className="text-[#D8FF72]"/> : <ArrowUpRight size={13} className="text-[#FFB4A8]"/>}{label}</p>
    <p className="mt-1 truncate text-sm font-black">{value}</p>
  </div>
}

function BalanceSkeleton() {
  return <SkeletonGroup label="Loading balance" className="rounded-2xl bg-[#173A2E] p-5">
    <Skeleton className="h-3 w-28 bg-white/15"/>
    <Skeleton className="mt-3 h-8 w-44 bg-white/15"/>
    <div className="mt-5 grid grid-cols-2 gap-2 sm:max-w-sm"><Skeleton className="h-14 rounded-xl bg-white/10"/><Skeleton className="h-14 rounded-xl bg-white/10"/></div>
  </SkeletonGroup>
}

export function KycPayoutsTab() {
  const tab = useKycPayouts()
  if (tab.isError) return <ErrorState title="We couldn’t load your wallet" onRetry={tab.retry}/>
  return <div className="flex flex-col gap-4">
    {tab.isLoading
      ? <BalanceSkeleton/>
      : <div className="flex min-w-0 flex-col gap-5 rounded-2xl bg-[#173A2E] p-5 text-white">
        <div className="flex min-w-0 flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="min-w-0">
            <p className="text-xs font-bold text-white/55">Available balance</p>
            <p className="mt-2 break-words text-2xl font-black sm:text-3xl">{tab.balanceLabel}</p>
            <p className="mt-1 text-[11px] font-bold text-[#D8FF72]">{tab.balanceNote}</p>
            {tab.walletAccount && <p className="mt-1 truncate text-[11px] font-semibold text-white/45">Wallet · {tab.walletAccount}</p>}
          </div>
          <Button onClick={tab.openTransfer} disabled={!tab.canTransfer} className="w-full shrink-0 bg-[#D8FF72] text-[#173A2E] shadow-none hover:bg-[#E4FF9A] sm:w-auto"><Send size={16}/> Transfer</Button>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:max-w-sm">
          <Flow icon="in" label="Money in" value={tab.inflowLabel}/>
          <Flow icon="out" label="Money out" value={tab.outflowLabel}/>
        </div>
      </div>}
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
      </div>
      <div className="mt-5 flex justify-end"><Button variant="outline" onClick={tab.openWithdraw} disabled={!tab.canWithdraw} className="w-full sm:w-auto"><Banknote size={16}/> Withdraw to payout bank</Button></div>
    </div>
    <WalletTransactions bankId={tab.bankId}/>
    {tab.transferOpen && <TransferModal bankId={tab.bankId} balance={tab.balance} hasPin={tab.hasPin} senderName={tab.senderName} preset={tab.transferPreset} onClose={tab.closeTransfer}/>}
  </div>
}
