import { Banknote, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, fieldBoxClass, fieldLabelClass } from '@/components/ui/Field'
import { ErrorState, SampleDataBadge } from '@/components/ui/misc'
import { FormModal } from '@/components/ui/Modal'
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { useKycPayouts, useWithdrawForm } from '../hooks/useKycPayouts'

function ReadOnlyField({ label, value, isLoading, badge }: { label: string; value: string; isLoading?: boolean; badge?: boolean }) {
  return <div className="min-w-0">
    <span className={cn(fieldLabelClass, 'flex flex-wrap items-center gap-2')}>{label}{badge && <SampleDataBadge/>}</span>
    <div className={fieldBoxClass}>{isLoading ? <Skeleton className="h-4 w-32"/> : <span className="truncate py-3 text-sm font-bold text-[#405B50]">{value}</span>}</div>
  </div>
}

function WithdrawModal({ balance, bankId, onClose }: { balance: number; bankId: string | null; onClose: () => void }) {
  const form = useWithdrawForm(balance, bankId, onClose)
  return <FormModal open onClose={onClose} eyebrow="Payouts" title="Withdraw funds" description={`Available: ${form.balanceLabel}`} onSubmit={form.onSubmit} footer={<>
    <Button variant="ghost" onClick={onClose}>Cancel</Button>
    <Button type="submit" loading={form.isSubmitting}><Banknote size={16}/> Withdraw</Button>
  </>}>
    <div className="flex flex-col gap-4">
      <Field label="Amount" inputMode="decimal" error={form.errors.amount?.message} {...form.register('amount')}/>
      <Field label="Transaction PIN" type="password" inputMode="numeric" autoComplete="off" error={form.errors.pin?.message} {...form.register('pin')}/>
    </div>
  </FormModal>
}

export function KycPayoutsTab() {
  const tab = useKycPayouts()
  if (tab.isError) return <ErrorState title="We couldn’t load your wallet" onRetry={tab.retry}/>
  return <div className="flex flex-col gap-4">
    {tab.isLoading
      ? <SkeletonGroup label="Loading balances" className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-28 rounded-2xl"/>)}</SkeletonGroup>
      : <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-3">
        {tab.balances.map((card, index) => <div key={card.label} className={cn('min-w-0 rounded-2xl p-5', index === 0 ? 'bg-[#173A2E] text-white' : 'border border-border bg-white text-[#173A2E]')}>
          <p className={cn('text-xs font-bold', index === 0 ? 'text-white/55' : 'text-[#7A8F85]')}>{card.label}</p>
          <p className="mt-2 break-words text-2xl font-black">{card.value}</p>
          <p className={cn('mt-1 text-[11px] font-bold', index === 0 ? 'text-[#D8FF72]' : 'text-[#8EA198]')}>{card.note}</p>
          {card.isSample && <SampleDataBadge className="mt-2"/>}
        </div>)}
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
      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-4 border-t border-border pt-5 sm:grid-cols-2">
        <ReadOnlyField label="Payout bank" value={tab.payoutBank} isLoading={tab.payoutBankLoading}/>
        <ReadOnlyField label="Payout schedule" value={tab.payoutSchedule} badge/>
      </div>
      <div className="mt-5 flex justify-end"><Button onClick={tab.openWithdraw} disabled={!tab.canWithdraw}><Banknote size={16}/> Withdraw funds</Button></div>
    </div>
    {tab.withdrawOpen && <WithdrawModal balance={tab.balance} bankId={tab.bankId} onClose={tab.closeWithdraw}/>}
  </div>
}
