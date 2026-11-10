import { Globe2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { fieldErrorClass, fieldLabelClass } from '@/components/ui/Field'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { useCustomDomain } from '../hooks/useCustomDomain'

export function CustomDomainTab() {
  const tab = useCustomDomain()
  if (tab.isLoading) return <CardSkeleton className="rounded-2xl border border-border bg-white p-6" lines={4}/>
  return <form onSubmit={tab.onSubmit} noValidate className="rounded-2xl border border-border bg-white p-6">
    <div className="flex items-center gap-3">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#E6E1FF] text-[#6655BD]"><Globe2 size={20}/></span>
      <div className="min-w-0"><h3 className="font-black text-[#173A2E]">Use your own domain</h3><p className="text-xs font-semibold text-[#879A91]">Give clients a branded address for booking.</p></div>
    </div>
    <div className="mt-6">
      <label className={fieldLabelClass} htmlFor="custom-domain">Custom domain</label>
      <div className={cn('flex rounded-xl border border-border bg-[#FBFCFA]', tab.errors.domain && 'border-[#C2483D]')}>
        <span className="flex items-center border-r border-border px-3 text-xs font-bold text-[#82958C]">https://</span>
        <input id="custom-domain" placeholder="book.yourbusiness.com" className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm font-extrabold text-[#173A2E] outline-none placeholder:font-semibold placeholder:text-[#9DAEA6]" {...tab.register('domain')}/>
        <button type="button" onClick={() => void tab.check()} disabled={tab.isChecking} className="shrink-0 px-4 text-xs font-black text-[#24764F] disabled:opacity-50">Check</button>
      </div>
      {tab.errors.domain && <span role="alert" className={fieldErrorClass}>{tab.errors.domain.message}</span>}
    </div>
    {tab.status === 'approved'
      ? <div className="mt-5 rounded-xl bg-[#E2F7E9] p-4"><p className="text-xs font-black text-[#157443]">Domain approved</p><p className="mt-1 text-xs font-semibold leading-relaxed text-[#2F7D57]">Your booking page is live on this address.</p></div>
      : <div className="mt-5 rounded-xl bg-[#FFF4D8] p-4"><p className="text-xs font-black text-[#805B12]">{tab.status === 'pending' ? 'Waiting for verification' : 'DNS setup required'}</p><p className="mt-1 break-words text-xs font-semibold leading-relaxed text-[#8B713E]">Add a CNAME record pointing <strong>{tab.recordName}</strong> to <strong>{tab.dnsTarget}</strong>. Verification can take up to 24 hours.</p></div>}
    <div className="mt-5 flex justify-end"><Button type="submit" loading={tab.isSubmitting}>Verify domain</Button></div>
  </form>
}
