import { ArrowDownLeft, ArrowUpRight, Banknote, KeyRound, Landmark, Send, ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { ErrorState, PageTitle } from '@/components/ui/misc'
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { PinModal } from './components/PinModal'
import { TransferModal } from './components/TransferModal'
import { WalletTransactions } from './components/WalletTransactions'
import { useWalletPage, type WalletPageModel } from './hooks/useWalletPage'

function Flow({ icon, label, value }: { icon: 'in' | 'out'; label: string; value: string }) {
  return <div className="min-w-0 rounded-xl bg-white/[0.07] px-3 py-2.5">
    <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-white/55">{icon === 'in' ? <ArrowDownLeft size={13} className="text-[#D8FF72]"/> : <ArrowUpRight size={13} className="text-[#FFB4A8]"/>}{label}</p>
    <p className="mt-1 truncate text-sm font-black">{value}</p>
  </div>
}

function BalanceCard({ page }: { page: WalletPageModel }) {
  const { balance, withdraw, transfer } = page
  return <section aria-label="Wallet balance" className="flex min-w-0 flex-col justify-between gap-6 rounded-2xl bg-[#173A2E] p-5 text-white sm:p-6">
    <div className="min-w-0">
      <p className="text-xs font-bold text-white/55">Available balance</p>
      <p className="mt-2 break-words text-3xl font-black sm:text-4xl">{balance.label}</p>
      <p className="mt-1 text-[11px] font-bold text-[#D8FF72]">{balance.note}</p>
      {balance.account && <p className="mt-2 truncate text-[11px] font-semibold text-white/45">Wallet · {balance.account}{balance.accountName ? ` · ${balance.accountName}` : ''}</p>}
    </div>
    <div className="grid grid-cols-2 gap-2 sm:max-w-md">
      <Flow icon="in" label="Money in" value={balance.inflow}/>
      <Flow icon="out" label="Money out" value={balance.outflow}/>
    </div>
    {page.hasWallet
      ? <div className="grid grid-cols-2 gap-2 sm:max-w-md">
        <Button onClick={withdraw.open} disabled={!withdraw.enabled} className="h-12 w-full bg-[#D8FF72] text-[#173A2E] shadow-none hover:bg-[#E4FF9A]"><Banknote size={18}/> Withdraw</Button>
        <Button onClick={transfer.open} disabled={!transfer.enabled} className="h-12 w-full border border-white/20 bg-white/[0.08] text-white shadow-none hover:bg-white/[0.14]"><Send size={17}/> Transfer</Button>
      </div>
      : <Button onClick={page.goToKyc} className="h-12 w-full bg-[#D8FF72] text-[#173A2E] shadow-none hover:bg-[#E4FF9A] sm:w-auto"><ShieldCheck size={17}/> Complete KYC</Button>}
    {withdraw.hint && <p className="-mt-3 text-[11px] font-semibold text-white/55">{withdraw.hint}</p>}
  </section>
}

function BalanceSkeleton() {
  return <SkeletonGroup label="Loading balance" className="rounded-2xl bg-[#173A2E] p-5 sm:p-6">
    <Skeleton className="h-3 w-28 bg-white/15"/>
    <Skeleton className="mt-3 h-9 w-48 bg-white/15"/>
    <Skeleton className="mt-2 h-3 w-40 bg-white/10"/>
    <div className="mt-6 grid grid-cols-2 gap-2 sm:max-w-md"><Skeleton className="h-14 rounded-xl bg-white/10"/><Skeleton className="h-14 rounded-xl bg-white/10"/></div>
    <div className="mt-6 grid grid-cols-2 gap-2 sm:max-w-md"><Skeleton className="h-12 rounded-xl bg-white/15"/><Skeleton className="h-12 rounded-xl bg-white/10"/></div>
  </SkeletonGroup>
}

function Card({ icon, title, badge, children }: { icon: ReactNode; title: string; badge?: ReactNode; children: ReactNode }) {
  return <section className="rounded-2xl border border-border bg-white p-5">
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#EDF4EF] text-[#24764F]">{icon}</span>
        <h2 className="truncate text-sm font-black text-[#173A2E]">{title}</h2>
      </div>
      {badge}
    </div>
    {children}
  </section>
}

function PinCard({ page }: { page: WalletPageModel }) {
  const { pin } = page
  return <Card icon={<KeyRound size={18}/>} title="Transaction PIN"
    badge={page.isLoading ? <Skeleton className="h-6 w-16 rounded-full"/> : <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide', pin.isSet ? 'bg-[#E2F7E9] text-[#157443]' : 'bg-[#FFF1CB] text-[#946000]')}>{pin.statusLabel}</span>}>
    {page.isLoading
      ? <SkeletonGroup label="Loading PIN status" className="mt-4 space-y-3"><Skeleton className="h-3 w-full"/><Skeleton className="h-10 w-full rounded-xl"/></SkeletonGroup>
      : <>
        <p className="mt-3 text-xs font-semibold leading-relaxed text-[#8A9C93]">{pin.note}</p>
        {pin.isSet
          ? <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => pin.open('change')} className="flex-1 sm:flex-none">Change PIN</Button>
            <Button variant="ghost" onClick={() => pin.open('forgot')} className="flex-1 sm:flex-none">Forgot PIN?</Button>
          </div>
          : <Button onClick={() => pin.open('set')} className="mt-4 w-full"><KeyRound size={16}/> Set PIN</Button>}
      </>}
  </Card>
}

function PayoutCard({ page }: { page: WalletPageModel }) {
  const { payout } = page
  return <Card icon={<Landmark size={18}/>} title="Payout bank">
    {payout.loading
      ? <SkeletonGroup label="Loading payout bank" className="mt-4 space-y-2"><Skeleton className="h-4 w-40"/><Skeleton className="h-3 w-28"/></SkeletonGroup>
      : <div className="mt-3 min-w-0">
        <p className="truncate text-sm font-extrabold text-[#29483B]">{payout.label}</p>
        <p className="mt-0.5 truncate text-xs font-semibold text-[#8A9C93]">{payout.missing ? 'Withdrawals go to your settlement account. Add one in KYC.' : payout.name || 'Withdrawals land here'}</p>
        {payout.missing && <Button variant="outline" onClick={page.goToKyc} className="mt-3 w-full">Add payout bank</Button>}
      </div>}
  </Card>
}

export default function WalletPage() {
  const page = useWalletPage()
  return <div className="mx-auto max-w-[1192px] p-5 md:p-8">
    <PageTitle title="Wallet" subtitle="Withdraw your earnings, send money and see every payment in and out."/>
    {page.isError
      ? <ErrorState title="We couldn’t load your wallet" onRetry={page.retry}/>
      : <div className="flex flex-col gap-6">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          {page.isLoading ? <BalanceSkeleton/> : <BalanceCard page={page}/>}
          <div className="flex min-w-0 flex-col gap-4">
            <PinCard page={page}/>
            <PayoutCard page={page}/>
          </div>
        </div>
        {page.isLoading
          ? <SkeletonGroup label="Loading transactions" className="space-y-3 rounded-2xl border border-border bg-white p-5">{Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-12 w-full rounded-xl"/>)}</SkeletonGroup>
          : <WalletTransactions bankId={page.bankId}/>}
      </div>}
    {page.transfer.isOpen && <TransferModal bankId={page.bankId} balance={page.rawBalance} hasPin={page.pin.isSet} senderName={page.senderName} preset={page.transfer.preset} onClose={page.transfer.close} onForgotPin={() => page.pin.open('forgot')}/>}
    {page.pin.mode && <PinModal mode={page.pin.mode} onClose={page.pin.close}/>}
  </div>
}
