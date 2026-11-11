import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { ErrorState } from '@/components/ui/misc'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { Toggle } from '@/components/ui/Toggle'
import { cn } from '@/lib/cn'
import { usePaymentOptions } from '../hooks/usePaymentOptions'

/** `embedded` drops the card frame, for use inside another card (the storefront). */
export function PaymentOptionsTab({ embedded = false }: { embedded?: boolean }) {
  const tab = usePaymentOptions()
  if (tab.isError) return <ErrorState title="We couldn’t load your payment options" onRetry={tab.retry}/>
  if (tab.isLoading) return <CardSkeleton className={embedded ? '' : 'rounded-2xl border border-border bg-white p-6'} lines={5}/>
  const BnplIcon = tab.bnpl.icon
  return <div className={cn(!embedded && 'rounded-2xl border border-border bg-white p-6')}>
    <h3 className="font-black text-[#173A2E]">How clients pay</h3>
    <p className="mt-1 text-xs font-semibold text-[#879A91]">Pick one option. It applies to every booking and service.</p>
    <div role="radiogroup" aria-label="How clients pay" className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-3">
      {tab.options.map(option => {
        const OptionIcon = option.icon
        return <button key={option.key} type="button" role="radio" aria-checked={option.enabled} onClick={option.select} className={cn('flex min-w-0 items-center gap-3 rounded-2xl border p-4 text-left transition', option.enabled ? 'border-[#329661] bg-[#F2FBF5] ring-2 ring-[#329661]/15' : 'border-border hover:border-[#9DB1A9]')}>
          <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', option.enabled ? 'bg-[#329661] text-white' : 'bg-[#EDF4EF] text-[#24764F]')}><OptionIcon size={18}/></span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-black text-[#29483B]">{option.name}</span><span className="block text-[11px] font-bold text-[#8B9D94]">{option.note}</span></span>
          <span aria-hidden="true" className={cn('grid h-5 w-5 shrink-0 place-items-center rounded-full border-2', option.enabled ? 'border-[#329661]' : 'border-[#C3D0C9]')}>{option.enabled && <span className="h-2.5 w-2.5 rounded-full bg-[#329661]"/>}</span>
        </button>
      })}
    </div>
    {tab.showDeposit && <Field label="Default deposit (%)" inputMode="numeric" className="mt-5 sm:max-w-[240px]" value={tab.deposit} onValueChange={tab.setDeposit} error={tab.depositError}/>}
    <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
      <div className="flex items-center gap-3 rounded-2xl border border-border p-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#EDF4EF] text-[#24764F]"><BnplIcon size={18}/></span>
        <div className="min-w-0 flex-1"><p className="text-sm font-black text-[#29483B]">{tab.bnpl.name}</p><p className="truncate text-[11px] font-bold text-[#8B9D94]">{tab.bnpl.note}</p></div>
        <Toggle enabled={tab.bnpl.enabled} disabled={tab.isBnplSaving} label={tab.bnpl.name} onChange={enabled => void tab.toggleBnpl(enabled)}/>
      </div>
    </div>
    <div className="mt-5 flex justify-end"><Button onClick={() => void tab.saveOptions()} loading={tab.isSaving}>Save options</Button></div>
  </div>
}
