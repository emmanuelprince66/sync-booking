import { CreditCard, Globe2, ShieldCheck, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { PageTitle } from '@/components/ui/misc'
import { cn } from '@/lib/cn'
import { CustomDomainTab } from './components/CustomDomainTab'
import { KycPayoutsTab } from './components/KycPayoutsTab'
import { PaymentOptionsTab } from './components/PaymentOptionsTab'
import { TeamTab } from './components/TeamTab'

const TABS = [
  { id: 'KYC & payouts', icon: ShieldCheck },
  { id: 'Team & attendees', icon: UserPlus },
  { id: 'Payment options', icon: CreditCard },
  { id: 'Custom domain', icon: Globe2 },
] as const

type SetupTab = typeof TABS[number]['id']

export default function SettingsPage() {
  const [tab, setTab] = useState<SetupTab>('KYC & payouts')
  return <div className="mx-auto max-w-[1192px] p-5 md:p-8">
    <PageTitle title="Business setup" subtitle="People, payments and trust—all in one place."/>
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
      <nav className="no-scrollbar flex h-fit gap-1 overflow-x-auto rounded-2xl border border-border bg-white p-2 lg:flex-col lg:gap-0.5">
        {TABS.map(item => {
          const TabIcon = item.icon
          return <button key={item.id} type="button" onClick={() => setTab(item.id)} className={cn('flex shrink-0 items-center gap-3 whitespace-nowrap rounded-xl px-3 py-3 text-left text-sm font-extrabold lg:w-full', tab === item.id ? 'bg-[#173A2E] text-white' : 'text-[#657C71] hover:bg-[#F2F6F1]')}><TabIcon size={17}/>{item.id}</button>
        })}
      </nav>
      <div className="min-w-0">
        {tab === 'KYC & payouts' && <KycPayoutsTab/>}
        {tab === 'Team & attendees' && <TeamTab/>}
        {tab === 'Payment options' && <PaymentOptionsTab/>}
        {tab === 'Custom domain' && <CustomDomainTab/>}
      </div>
    </div>
  </div>
}
