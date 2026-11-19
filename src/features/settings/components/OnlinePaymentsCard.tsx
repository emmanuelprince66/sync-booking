import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Globe2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useCurrentBusiness, useUpdateBusiness } from '@/api/business'
import { useKycStatus } from '@/api/kyc'
import { Button } from '@/components/ui/Button'
import { Toggle } from '@/components/ui/Toggle'
import { cn } from '@/lib/cn'
import { paths } from '@/routes/paths'

type Payer = 'customer' | 'business'

/**
 * Online payments, as sink-inventory's Payment settings (hooks/usePayment): one switch for taking
 * payments online (business.allow_online_payment, only once KYC is done) and who carries the
 * transaction charges (pay_transaction_charges: true = the business, false = the customer).
 */
export function OnlinePaymentsCard() {
  const navigate = useNavigate()
  const business = useCurrentBusiness()
  const kyc = useKycStatus()
  const save = useUpdateBusiness()
  const raw = business.data?.raw ?? {}
  const savedOnline = raw.allow_online_payment === true
  const savedPayer: Payer = raw.pay_transaction_charges === true ? 'business' : 'customer'
  const [online, setOnline] = useState<boolean | null>(null)
  const [payer, setPayer] = useState<Payer | null>(null)
  const current = { online: online ?? savedOnline, payer: payer ?? savedPayer }
  const kycDone = raw.kyc === true || (kyc.data?.tier ?? 0) > 0
  const changed = current.online !== savedOnline || current.payer !== savedPayer

  const toggle = (next: boolean) => {
    if (next && !kycDone) {
      toast.info('Complete KYC to take payments online.')
      navigate(paths.kyc)
      return
    }
    setOnline(next)
  }

  const submit = () => save.mutate({ allow_online_payment: current.online, pay_transaction_charges: current.payer === 'business' }, {
    onSuccess: () => { toast.success('Online payments saved'); setOnline(null); setPayer(null) },
    onError: error => toast.error(errorMessage(error, 'Could not save online payments.')),
  })

  if (business.isLoading) return <div className="h-40 animate-pulse rounded-2xl border border-border bg-white"/>
  return <div className="rounded-2xl border border-border bg-white p-6">
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#EDF4EF] text-[#24764F]"><Globe2 size={18}/></span>
        <div className="min-w-0"><h3 className="font-black text-[#173A2E]">Online payments</h3><p className="mt-1 text-xs font-semibold text-[#879A91]">Let clients pay by card or transfer when they book on your storefront.</p></div>
      </div>
      <Toggle enabled={current.online} onChange={toggle} label="Accept online payments"/>
    </div>
    {!kycDone && <button type="button" onClick={() => navigate(paths.kyc)} className="mt-4 flex w-full items-center gap-2 rounded-xl bg-[#FFF7DF] p-3 text-left text-xs font-bold text-[#8F5F00]"><ShieldCheck size={15} className="shrink-0"/>Complete KYC first to switch on online payments. Start verification →</button>}
    <div className={cn('mt-5 transition-opacity', !current.online && 'pointer-events-none opacity-50')} aria-disabled={!current.online}>
      <p className="text-xs font-black text-[#29483B]">Who pays the transaction charges?</p>
      <div role="radiogroup" aria-label="Who pays the transaction charges" className="mt-2 grid grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-2">
        {([['customer', 'The client', 'Charges are added to what the client pays'], ['business', 'My business', 'Charges come out of what you receive']] as const).map(([value, title, note]) => <button key={value} type="button" role="radio" aria-checked={current.payer === value} onClick={() => setPayer(value)} className={cn('rounded-2xl border p-4 text-left transition', current.payer === value ? 'border-[#329661] bg-[#F1FAF4]' : 'border-border hover:border-[#9BC6AE]')}>
          <span className="flex items-center justify-between gap-2"><b className="text-sm text-[#29483B]">{title}</b><span aria-hidden="true" className={cn('grid h-5 w-5 place-items-center rounded-full border-2', current.payer === value ? 'border-[#329661]' : 'border-[#C3D0C9]')}>{current.payer === value && <span className="h-2.5 w-2.5 rounded-full bg-[#329661]"/>}</span></span>
          <span className="mt-1 block text-[11px] font-bold text-[#8B9D94]">{note}</span>
        </button>)}
      </div>
    </div>
    <div className="mt-5 flex justify-end"><Button onClick={submit} loading={save.isPending} disabled={!changed}>Save online payments</Button></div>
  </div>
}
