import { ScrollText } from 'lucide-react'
import { TextareaField } from '@/components/ui/Field'
import { OptionSelect } from '@/components/ui/OptionSelect'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { Toggle } from '@/components/ui/Toggle'
import type { PoliciesModel } from '../hooks/usePolicies'
import { CardActions, SettingsCard } from './SettingsCard'

export function PoliciesCard({ policies }: { policies: PoliciesModel }) {
  return <SettingsCard icon={ScrollText} title="Booking policies" description="What clients agree to before they book: cancellations, deposits and anything else.">
    {policies.isLoading
      ? <CardSkeleton className="p-0" lines={4}/>
      : <form onSubmit={policies.onSubmit} noValidate className="flex flex-col gap-5">
        <OptionSelect label="Cancellation window" searchable={false} options={policies.cancellationOptions} {...policies.register('cancellationWindowHours')}/>
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-border p-4">
          <div className="min-w-0"><p className="text-sm font-black text-[#29483B]">Deposits are non-refundable</p><p className="mt-0.5 text-[11px] font-bold text-[#8B9D94]">Clients keep nothing back if they cancel a deposit booking.</p></div>
          <Toggle enabled={policies.nonRefundable} onChange={policies.setNonRefundable} label="Deposits are non-refundable"/>
        </div>
        <TextareaField label="Your policy" rows={5} placeholder="Late arrivals, what to bring, how to reschedule…" error={policies.errors.policyText?.message} {...policies.register('policyText')}/>
        <CardActions type="submit" dirty={policies.dirty} saving={policies.saving} onReset={policies.reset} saveLabel="Save policies"/>
      </form>}
  </SettingsCard>
}
