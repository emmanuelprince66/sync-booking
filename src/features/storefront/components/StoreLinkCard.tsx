import { Check, Copy, Download, ExternalLink, Globe2, Link2, MessageCircle, Plus, Settings2 } from 'lucide-react'
import { QrCode } from '@/components/ui/QrCode'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import type { StoreLinkModel } from '../hooks/useStoreLink'
import { CustomDomainModal } from './CustomDomainModal'
import { SettingsCard } from './SettingsCard'

const DOMAIN_BADGES = {
  connected: { label: 'Connected', className: 'bg-[#E2F7E9] text-[#157443]' },
  pending: { label: 'Awaiting DNS', className: 'bg-[#FFF1CB] text-[#946000]' },
} as const

const linkButton = 'inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-white px-3 text-xs font-extrabold text-[#3E584E] transition hover:border-[#9DB1A9] hover:text-[#173A2E]'

export function StoreLinkCard({ link }: { link: StoreLinkModel }) {
  return <SettingsCard icon={Link2} title="Booking link" description="Where clients find you online, and the QR code for your counter or mirror.">
    {link.hasUrl
      ? <div className="grid grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-[minmax(0,1fr)_200px]">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex min-w-0 items-center gap-2 rounded-xl border border-border bg-[#FBFCFA] px-3 py-3 text-[#29483B]"><Link2 size={16} className="shrink-0 text-[#24764F]"/><span className="truncate text-sm font-extrabold">{link.displayUrl}</span></div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Button onClick={link.copyUrl} className="h-10 text-xs">{link.copied ? <Check size={15}/> : <Copy size={15}/>}{link.copied ? 'Copied' : 'Copy link'}</Button>
            <a href={link.url} target="_blank" rel="noreferrer" className={linkButton}><ExternalLink size={15}/> Open</a>
            <a href={link.shareOnWhatsApp} target="_blank" rel="noreferrer" className={cn(linkButton, 'col-span-2 sm:col-span-1')}><MessageCircle size={15}/> Share</a>
          </div>
          <p className="text-[11px] font-semibold leading-relaxed text-[#8A9C93]">Share it on WhatsApp, Instagram and your bio. Clients pick a service, a time and pay to secure the slot.</p>
        </div>
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-[#FBFCFA] p-4">
          <div id={link.qrId} className="rounded-xl bg-white p-2"><QrCode value={link.url} title="Booking page QR code"/></div>
          <button type="button" onClick={() => void link.downloadQr()} className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#24764F] hover:text-[#173A2E]"><Download size={14}/> Download QR</button>
        </div>
      </div>
      : <p className="rounded-xl bg-[#FFF4D8] p-3 text-xs font-bold leading-relaxed text-[#805B12]">Your public link appears here once your store has a web address. Save your business name under Details &amp; contact to create it.</p>}

    <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-[#F4F8F5] p-4 sm:flex-row sm:items-center">
      <span className="hidden h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#6655BD] sm:grid"><Globe2 size={18}/></span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-black text-[#29483B]">Custom domain</span>{link.domainStatus !== 'none' && <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-extrabold', DOMAIN_BADGES[link.domainStatus].className)}>{DOMAIN_BADGES[link.domainStatus].label}</span>}</div>
        <p className="mt-0.5 truncate text-xs font-semibold text-[#8A9C93]">{link.domain || 'Use your own address, like book.yourbusiness.com'}</p>
      </div>
      <Button variant="outline" onClick={link.domainDialog.open} className="h-10 text-xs">{link.domain ? <Settings2 size={15}/> : <Plus size={15}/>}{link.domain ? 'Change domain' : 'Connect domain'}</Button>
    </div>
    <CustomDomainModal open={link.domainDialog.isOpen} onClose={link.domainDialog.close} currentDomain={link.domain}/>
  </SettingsCard>
}
