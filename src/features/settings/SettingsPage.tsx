import { Building2, CreditCard, Globe2, ShieldCheck, Store, UserCog } from 'lucide-react'
import { PageTitle } from '@/components/ui/misc'
import { BranchesPanel } from '@/features/branches/BranchesPanel'
import { BranchStaffView } from '@/features/branches/BranchStaffView'
import { StorefrontPanel } from '@/features/storefront/StorefrontPanel'
import { TeamPanel } from '@/features/team/TeamPanel'
import { cn } from '@/lib/cn'
import type { SetupTab } from '@/routes/paths'
import { CustomDomainTab } from './components/CustomDomainTab'
import { KycPayoutsTab } from './components/KycPayoutsTab'
import { PaymentOptionsTab } from './components/PaymentOptionsTab'
import { useSetupTabs } from './hooks/useSetupTabs'

const TABS: { id: SetupTab; label: string; icon: typeof ShieldCheck }[] = [
  { id: 'kyc', label: 'KYC & payouts', icon: ShieldCheck },
  { id: 'payments', label: 'Payment options', icon: CreditCard },
  { id: 'domain', label: 'Custom domain', icon: Globe2 },
  { id: 'storefront', label: 'Storefront', icon: Store },
  { id: 'team', label: 'Team', icon: UserCog },
  { id: 'branches', label: 'Branches', icon: Building2 },
]

/** /settings ("Setup"): payments, trust, the storefront, the team and branches, one tab each (?tab=…). */
export default function SettingsPage() {
  const { tab, branchId, setTab } = useSetupTabs()
  return <div className="mx-auto max-w-[1192px] p-5 md:p-8">
    <PageTitle title="Setup" subtitle="Your storefront, people, branches and payments—all in one place."/>
    <nav aria-label="Setup sections" role="tablist" className="no-scrollbar mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-border bg-white p-2">
      {TABS.map(item => {
        const TabIcon = item.icon
        return <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} onClick={() => setTab(item.id)} className={cn('flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-left text-sm font-extrabold', tab === item.id ? 'bg-[#173A2E] text-white' : 'text-[#657C71] hover:bg-[#F2F6F1]')}><TabIcon size={16}/>{item.label}</button>
      })}
    </nav>
    <div className="min-w-0">
      {tab === 'kyc' && <KycPayoutsTab/>}
      {tab === 'payments' && <PaymentOptionsTab/>}
      {tab === 'domain' && <CustomDomainTab/>}
      {tab === 'storefront' && <StorefrontPanel/>}
      {tab === 'team' && <TeamPanel/>}
      {tab === 'branches' && (branchId ? <BranchStaffView key={branchId} branchId={branchId}/> : <BranchesPanel/>)}
    </div>
  </div>
}
