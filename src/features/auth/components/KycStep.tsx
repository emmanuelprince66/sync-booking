import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { BackLink } from '@/components/ui/misc'
import { useKycStep } from '../hooks/useKycStep'

export function KycStep() {
  const { benefits, startKyc, goBack, finish } = useKycStep()
  return <>
    <div className="mt-7 rounded-3xl border border-[#DCE5DF] bg-[#F8FAF8] p-6">
      <div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E2F7E9] text-[#24764F]"><Icon name="shield" size={23}/></div><div><div className="text-sm font-extrabold text-[#29483B]">Business verification</div><div className="mt-1 text-[11px] leading-5 text-[#75877E]">Verify your identity or your business’s documents to increase payouts and transaction limits.</div></div></div>
      <div className="mt-5 flex flex-col gap-2">{benefits.map(item => <div key={item} className="flex items-center gap-2 text-[11px] font-bold text-[#52695D]"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E2F7E9] text-[#24764F]"><Icon name="check" size={11} stroke={3}/></span>{item}</div>)}</div>
    </div>
    <Button icon="shield" onClick={startKyc} className="mt-5 w-full py-3.5">Start KYC verification</Button>
    <Button variant="ghost" onClick={finish} className="mt-2 w-full">I’ll complete KYC later</Button>
    <BackLink label="Back to business details" onClick={goBack} className="mt-4"/>
  </>
}
