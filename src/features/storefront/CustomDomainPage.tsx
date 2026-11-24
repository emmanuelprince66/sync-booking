import { useNavigate } from 'react-router'
import { ArrowRight, Check, Globe2, Link2, Settings2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PageTitle } from '@/components/ui/misc'
import { customDomainUpgradePath, setupPath } from '@/routes/paths'

const benefits = [
  ['Professional', 'Give clients a polished, trustworthy booking address.'],
  ['Easy to remember', 'Make it simple for clients to find your booking page again.'],
  ['Your brand', 'Use your business name instead of a shared Sync360 link.'],
]

export default function CustomDomainPage() {
  const navigate = useNavigate()

  return <div className="mx-auto max-w-5xl p-5 md:p-8">
    <PageTitle title="Get your own domain" subtitle="Your business deserves a .com or .ng. Give clients a booking address that feels like yours."/>

    <section className="overflow-hidden rounded-3xl bg-[#173A2E] p-6 text-white sm:p-8">
      <p className="text-[10px] font-black uppercase tracking-[.12em] text-[#D8FF72]">A better address for your booking page</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <div className="rounded-2xl bg-white/10 p-4">
          <p className="text-[9px] font-black uppercase tracking-[.1em] text-white/55">Your current booking link</p>
          <p className="mt-2 break-all text-sm font-bold text-white/85">store.sync360.africa/yourbusiness/services</p>
        </div>
        <span className="flex justify-center text-[#D8FF72]"><ArrowRight size={20}/></span>
        <div className="rounded-2xl bg-white p-4 text-[#173A2E]">
          <p className="text-[9px] font-black uppercase tracking-[.1em] text-[#82958C]">Your own domain</p>
          <p className="mt-2 break-all text-sm font-black">book.yourbusiness.com</p>
          <p className="mt-1 text-[10px] font-bold text-[#82958C]">or book.yourbusiness.ng</p>
        </div>
      </div>
    </section>

    <section className="mt-5 rounded-3xl border border-border bg-white p-5 sm:p-6">
      <h2 className="text-sm font-black text-[#173A2E]">Why upgrade?</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {benefits.map(([title, description]) => <div key={title} className="flex items-start gap-3 rounded-2xl bg-[#F4F8F5] p-4">
          <Check size={16} className="mt-0.5 shrink-0 text-[#329661]"/>
          <div><h3 className="text-xs font-black text-[#29483B]">{title}</h3><p className="mt-1 text-[10px] font-semibold leading-4 text-[#71867C]">{description}</p></div>
        </div>)}
      </div>
    </section>

    <section className="mt-6">
      <div>
        <h2 className="text-sm font-black text-[#173A2E]">How to get your domain</h2>
        <p className="mt-1 text-[11px] font-semibold text-[#82958C]">Choose the option that works best for you.</p>
      </div>
      <div className="mt-4 grid items-stretch gap-4 lg:grid-cols-2">
        <article className="group flex flex-col rounded-3xl border border-border bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[#B7D2BE] hover:shadow-[0_14px_36px_rgba(9,38,28,.08)] sm:p-6">
          <div className="flex items-start gap-3.5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#EAF5E9] text-[#24764F] transition group-hover:bg-[#DFF0DC]"><Link2 size={20}/></span>
            <div className="min-w-0 flex-1">
              <span className="inline-flex rounded-full bg-[#F3F7F4] px-2 py-1 text-[8px] font-black uppercase tracking-[.1em] text-[#71867C]">Option 1</span>
              <h3 className="mt-2 text-sm font-black text-[#173A2E]">I already have a domain</h3>
              <p className="mt-1 text-[10px] font-semibold leading-4 text-[#82958C]">We’ll guide you through connecting it to your booking page.</p>
            </div>
          </div>
          <p className="mt-5 flex-1 rounded-2xl bg-[#F7FAF8] p-4 text-[11px] font-semibold leading-5 text-[#6C7E75]">After upgrading, open <strong className="text-[#405B50]">Setup → Custom domain</strong>, enter your domain, and follow the DNS instructions. A subdomain such as <strong className="text-[#405B50]">book.yourbusiness.com</strong> works best.</p>
          <Button onClick={() => navigate(setupPath('domain'))} className="mt-4 min-h-11 w-full justify-between"><span>I have a domain</span><ArrowRight size={16}/></Button>
        </article>

        <article className="group flex flex-col rounded-3xl border border-border bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[#B7D2BE] hover:shadow-[0_14px_36px_rgba(9,38,28,.08)] sm:p-6">
          <div className="flex items-start gap-3.5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#EAF5E9] text-[#24764F] transition group-hover:bg-[#DFF0DC]"><Globe2 size={20}/></span>
            <div className="min-w-0 flex-1">
              <span className="inline-flex rounded-full bg-[#F3F7F4] px-2 py-1 text-[8px] font-black uppercase tracking-[.1em] text-[#71867C]">Option 2</span>
              <h3 className="mt-2 text-sm font-black text-[#173A2E]">I need a domain</h3>
              <p className="mt-1 text-[10px] font-semibold leading-4 text-[#82958C]">Buy one yourself or ask us to help you get started.</p>
            </div>
          </div>
          <div className="mt-5 flex-1 space-y-2">
            <div className="flex items-start gap-2.5 rounded-2xl bg-[#F7FAF8] p-3.5">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white text-[9px] font-black text-[#24764F]">1</span>
              <p className="text-[10px] font-semibold leading-4 text-[#6C7E75]"><strong className="text-[#405B50]">Buy it yourself</strong> from any domain provider, then connect it in Setup.</p>
            </div>
            <div className="flex items-start gap-2.5 rounded-2xl bg-[#F7FAF8] p-3.5">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white text-[9px] font-black text-[#24764F]">2</span>
              <p className="text-[10px] font-semibold leading-4 text-[#6C7E75]"><strong className="text-[#405B50]">Get help</strong> and we’ll help you choose, buy, and set it up.</p>
            </div>
          </div>
          <a href="mailto:support@sync360.africa?subject=Help%20with%20a%20custom%20domain" className="mt-4 inline-flex min-h-11 w-full items-center justify-between rounded-xl bg-[#EAF5E9] px-4 py-2.5 text-sm font-black text-[#24764F] transition hover:bg-[#DFF0DC]">Contact us to help me <ArrowRight size={16}/></a>
        </article>
      </div>
    </section>

    <section className="mt-6 rounded-3xl border border-border bg-white p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#EAF5E9] text-[#24764F]"><Settings2 size={17}/></span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-black text-[#29483B]">What happens during setup?</h2>
          <p className="mt-1 text-[11px] font-semibold leading-5 text-[#6C7E75]">Your domain provider will ask you to add a CNAME record pointing to your booking page:</p>
          <div className="mt-3 grid gap-2 rounded-2xl bg-[#F4F8F5] p-4 sm:grid-cols-3">
            <div><p className="text-[9px] font-black uppercase tracking-[.08em] text-[#82958C]">Record type</p><p className="mt-1 text-xs font-black text-[#29483B]">CNAME</p></div>
            <div><p className="text-[9px] font-black uppercase tracking-[.08em] text-[#82958C]">Host example</p><p className="mt-1 text-xs font-black text-[#29483B]">book</p></div>
            <div><p className="text-[9px] font-black uppercase tracking-[.08em] text-[#82958C]">Points to</p><p className="mt-1 break-all text-xs font-black text-[#29483B]">store.sync360.africa</p></div>
          </div>
          <p className="mt-3 flex items-start gap-2 text-[10px] font-semibold leading-4 text-[#82958C]"><ShieldCheck size={14} className="mt-0.5 shrink-0"/>We’ll show the exact values for your domain during setup. DNS changes can take up to 48 hours; your existing booking link keeps working while they update.</p>
        </div>
      </div>
    </section>

    <section className="mt-5 flex flex-col items-start justify-between gap-4 rounded-3xl bg-[#173A2E] p-5 text-white sm:flex-row sm:items-center sm:p-6">
      <div><h2 className="text-sm font-black">Ready to make your booking page yours?</h2><p className="mt-1 text-[11px] font-semibold leading-5 text-white/65">Upgrade to Sync Plus or higher to unlock a custom domain.</p></div>
      <Button onClick={() => navigate(customDomainUpgradePath())} className="w-full bg-[#329661] hover:bg-[#24764F] sm:w-auto">Upgrade <ArrowRight size={16}/></Button>
    </section>
  </div>
}
