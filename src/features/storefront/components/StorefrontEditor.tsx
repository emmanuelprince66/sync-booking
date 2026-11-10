import type { StorefrontProfile, StoreTheme } from '@/api/storefront'
import { BackLink } from '@/components/ui/misc'
import { PaymentOptionsTab } from '@/features/settings/components/PaymentOptionsTab'
import { cn } from '@/lib/cn'
import { useStorefrontEditor } from '../hooks/useStorefrontEditor'
import { BrandingCard } from './BrandingCard'
import { LivePreview } from './LivePreview'
import { PoliciesCard } from './PoliciesCard'
import { StoreDaysCard } from './StoreDaysCard'
import { StoreDetailsCard } from './StoreDetailsCard'
import { StoreLinkCard } from './StoreLinkCard'

/** Tabs over every storefront section, with the live preview beside them. Mounted once the profile has loaded. */
export function StorefrontEditor({ profile, themes }: { profile: StorefrontProfile; themes: StoreTheme[] }) {
  const editor = useStorefrontEditor(profile, themes)
  return <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
    <div className="min-w-0 rounded-2xl border border-border bg-white">
      <div role="tablist" aria-label="Storefront sections" className="no-scrollbar flex gap-1 overflow-x-auto border-b border-border px-3 pt-3 md:px-5">
        {editor.tabs.map(item => <button key={item} type="button" role="tab" aria-selected={editor.tab === item} onClick={() => editor.setTab(item)} className={cn('flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-extrabold', editor.tab === item ? 'border-[#329661] text-[#173A2E]' : 'border-transparent text-[#84968E] hover:text-[#29483B]')}>
          {item}{editor.unsaved[item] && <span className="h-1.5 w-1.5 rounded-full bg-[#E0A21B]" aria-label="unsaved changes"/>}
        </button>)}
      </div>
      <div className="flex flex-col gap-5 p-5 md:p-6">
        {editor.subView && <BackLink label={editor.subView.backLabel} onClick={editor.subView.goBack} className="self-start"/>}
        {editor.tab === 'Booking link' && <StoreLinkCard link={editor.link}/>}
        {editor.tab === 'Branding' && <BrandingCard branding={editor.branding} name={editor.preview.name}/>}
        {editor.tab === 'Details & contact' && <StoreDetailsCard details={editor.details}/>}
        {editor.tab === 'Opening days' && <StoreDaysCard days={editor.days}/>}
        {editor.tab === 'Policies' && <PoliciesCard policies={editor.policies}/>}
        {editor.tab === 'Payments' && <PaymentOptionsTab embedded/>}
      </div>
    </div>
    <LivePreview preview={editor.preview}/>
  </div>
}
