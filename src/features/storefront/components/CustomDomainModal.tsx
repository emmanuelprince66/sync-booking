import { Check, Clock, Copy } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { BackLink } from '@/components/ui/misc'
import { FormModal } from '@/components/ui/Modal'
import { cn } from '@/lib/cn'
import { useCustomDomainFlow } from '../hooks/useCustomDomainFlow'

/** Keyed by the saved domain, so every opening starts fresh at step 1. */
export function CustomDomainModal({ open, onClose, currentDomain }: { open: boolean; onClose: () => void; currentDomain: string }) {
  if (!open) return null
  return <DomainFlow key={currentDomain} currentDomain={currentDomain} onClose={onClose}/>
}

function DomainFlow({ currentDomain, onClose }: { currentDomain: string; onClose: () => void }) {
  const flow = useCustomDomainFlow(currentDomain, onClose)
  const isDns = flow.step === 2
  return <FormModal open onClose={onClose} eyebrow={`Step ${flow.step} of 2`} title="Connect a custom domain" description={isDns ? 'Point your domain to CLIQBOOK' : 'Enter a domain you own'}
    onSubmit={event => { event.preventDefault(); if (isDns) flow.submit(); else flow.continueToDns() }}
    footer={isDns
      ? <><Button variant="ghost" onClick={flow.back}>Back</Button><Button type="submit" loading={flow.saving}><Check size={16}/> I’ve added the record</Button></>
      : <><Button variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit">Continue</Button></>}>
    <div className="mb-5 flex gap-2">{[1, 2].map(item => <span key={item} className={cn('h-1.5 flex-1 rounded-full', item <= flow.step ? 'bg-[#329661]' : 'bg-[#E3EAE6]')}/>)}</div>
    {!isDns
      ? <Field label="Your domain" placeholder="book.yourbusiness.com" value={flow.input} onValueChange={flow.setInput} error={flow.error} hint="Subdomains like book. or appointments. work best."/>
      : <div className="flex flex-col gap-4">
        <BackLink label="Change domain" onClick={flow.back} className="self-start"/>
        <p className="text-sm font-semibold leading-relaxed text-[#60796E]">In your domain provider’s DNS settings, add this record for <strong className="font-black text-[#173A2E]">{flow.domain}</strong>:</p>
        <div className="overflow-hidden rounded-2xl border border-border">
          <div className="grid grid-cols-[64px_minmax(0,1fr)] border-b border-border bg-[#F8FAF7] px-4 py-2.5 text-[10px] font-black uppercase tracking-[.08em] text-[#8A9C93] sm:grid-cols-[72px_96px_minmax(0,1fr)]"><span>Type</span><span className="hidden sm:block">Host</span><span>Points to</span></div>
          <div className="grid grid-cols-[64px_minmax(0,1fr)] items-center px-4 py-3 text-sm font-extrabold text-[#29483B] sm:grid-cols-[72px_96px_minmax(0,1fr)]">
            <span>CNAME</span>
            <span className="hidden truncate sm:block">{flow.hostLabel}</span>
            <span className="flex min-w-0 items-center justify-between gap-2"><span className="truncate">{flow.dnsTarget}</span><button type="button" onClick={flow.copyTarget} aria-label="Copy CNAME target" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#24764F] hover:bg-[#EDF4EF]">{flow.copied ? <Check size={15}/> : <Copy size={15}/>}</button></span>
          </div>
        </div>
        <p className="flex items-start gap-2 rounded-xl bg-[#F1F5F0] p-3 text-xs font-semibold leading-relaxed text-[#60796E]"><Clock size={15} className="mt-0.5 shrink-0"/>DNS changes can take up to 48 hours. Your booking page keeps working on its CLIQBOOK link until the domain is verified. If your provider doesn’t allow a CNAME on the root domain, use a subdomain.</p>
      </div>}
  </FormModal>
}
