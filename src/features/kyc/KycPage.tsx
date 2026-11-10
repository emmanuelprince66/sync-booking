import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { BackLink } from '@/components/ui/misc'
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { CorporateFlow, IndividualFlow } from './components/Flows'
import { Notice } from './components/KycUi'
import { ACCOUNT_TYPES, useKycPage } from './hooks/useKycPage'

/**
 * Identity verification: a full page rather than a modal (sink-inventory's
 * KycConfirm). Corporate Tier 2 alone runs to seven company documents plus two
 * uploads per director, and a page keeps a half-finished verification safe
 * from a stray click outside.
 */
export default function KycPage() {
  const page = useKycPage()

  return <div className="mx-auto w-full max-w-[1192px] p-5 md:p-8">
    <header className="mb-6">
      {page.canChangeType ? <BackLink label="Change account type" onClick={page.backToChooser} className="mb-3"/>
        : page.isUpgrading ? <BackLink label="Back to my individual verification" onClick={page.backToChooser} className="mb-3"/>
        : <BackLink label="Back" onClick={page.exit} className="mb-3"/>}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-black tracking-tight text-[#173A2E]">{page.headline}</h1>
          <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-[#71867C]">{page.subhead}</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-[#E2EAE5] bg-white px-3 py-2 text-[11px] font-bold text-[#60736A]">
          <span className="text-[#24764F]"><Icon name="shield" size={13}/></span>Encrypted &amp; verified by licensed providers
        </span>
      </div>
    </header>

    {page.isUpgrading && <Notice tone="info" title="This starts a new corporate verification" className="mb-5">
      You will need your CAC documents, TIN and a record for every director. Nothing here changes the individual account you already verified.
    </Notice>}

    {page.loading
      ? <SkeletonGroup label="Loading verification" className="grid gap-4 md:grid-cols-2"><Skeleton className="h-64 rounded-2xl"/><Skeleton className="h-64 rounded-2xl"/></SkeletonGroup>
      : page.chosen
        ? page.chosen.value === 'individual'
          ? <IndividualFlow kyc={page.kyc} onUpgradeToCorporate={page.upgradeToCorporate}/>
          : <CorporateFlow kyc={page.kyc}/>
        : <div className="flex flex-col gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            {ACCOUNT_TYPES.map(type => {
              const active = page.selection === type.value
              return <button key={type.value} type="button" aria-pressed={active} onClick={() => page.setSelection(type.value)} className={cn('rounded-2xl border-2 bg-white p-5 text-left transition', active ? 'border-[#329661] shadow-[0_8px_24px_rgba(19,63,43,.08)]' : 'border-[#E2EAE5] hover:border-[#BDD4C3]')}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', active ? 'bg-[#329661] text-white' : 'bg-[#F0F4F1] text-[#64776D]')}><Icon name={type.icon} size={20}/></span>
                    <div><h2 className="text-sm font-black text-[#173A2E]">{type.title}</h2><p className="mt-0.5 text-xs text-[#7A8F85]">{type.blurb}</p></div>
                  </div>
                  <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2', active ? 'border-[#329661] bg-[#329661] text-white' : 'border-[#CAD6CF]')}>{active && <Icon name="check" size={11} stroke={3}/>}</span>
                </div>
                <ul className="mt-4 flex flex-col gap-2.5 border-t border-[#EDF1EF] pt-4">
                  {type.tiers.map(tier => <li key={tier.tier} className="flex items-start gap-2.5">
                    <span className="mt-0.5 shrink-0 text-[#24764F]"><Icon name="shield" size={14}/></span>
                    <span><span className="block text-xs font-extrabold text-[#173A2E]">Tier {tier.tier} · {tier.limit} daily</span><span className="block text-[11px] text-[#7A8F85]">{tier.requirement}</span></span>
                  </li>)}
                </ul>
              </button>
            })}
          </div>
          <div className="flex flex-col items-center gap-3">
            <Button onClick={page.confirmSelection} className="h-12 w-full sm:w-auto sm:min-w-64">Continue <Icon name="arrow" size={16}/></Button>
            <p className="text-[11px] text-[#7A8F85]">You can upgrade your tier at any time after verification.</p>
          </div>
        </div>}
  </div>
}
