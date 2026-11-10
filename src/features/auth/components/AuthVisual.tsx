import { Icon } from '@/components/ui/Icon'
import { Logo } from '@/components/ui/Logo'
import { cn } from '@/lib/cn'
import { AUTH_TIMES } from '../constants'
import { useAuthVisualSlides } from '../hooks/useAuthVisualSlides'

/** Animated brand panel on the left of every auth screen (desktop only). */
export function AuthVisual() {
  const { slides, slide, current, goTo } = useAuthVisualSlides()
  return <section className="auth-gradient relative hidden min-h-screen overflow-hidden p-10 text-white lg:flex lg:flex-col">
    <div className="relative z-10"><Logo inverse/></div>
    <div className="pointer-events-none absolute -right-32 -top-32 h-[430px] w-[430px] rounded-full border-[75px] border-[#D8FF72]/[.06]"/>
    <div className="pointer-events-none absolute -bottom-40 -left-28 h-[460px] w-[460px] rounded-full bg-[#D8FF72]/10 blur-2xl"/>
    <div className="relative z-10 mx-auto my-auto w-full max-w-xl">
      <div className="mb-9">
        <div className="text-[11px] font-extrabold uppercase tracking-[.18em] text-[#D8FF72]">Bookings, beautifully simple</div>
        <div className="mt-4 max-w-lg text-[38px] font-black leading-[1.08] tracking-[-1.5px]">Fill your calendar, without the back-and-forth.</div>
      </div>
      <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-white/[.08] p-7 backdrop-blur-md">
        <div className="grid grid-cols-6 gap-2" aria-hidden="true">{AUTH_TIMES.map((time, index) => <span key={time} className="auth-slot rounded-xl border border-white/10 py-2.5 text-center font-mono text-[11px] font-bold text-white/60" style={{ animationDelay: `${index * 0.75}s` }}>{time}</span>)}</div>
        <div className="mt-7 flex items-end justify-between gap-6">
          <div className="max-w-[370px]" key={slide} aria-live="polite">
            <div className="auth-slide-in inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[.1em] text-[#D8FF72]"><Icon name={current.icon} size={13}/>{current.label}</div>
            <div className="auth-slide-in mt-3 text-lg font-black">{current.title}</div>
            <div className="auth-slide-in mt-1 text-[11px] leading-5 text-white/55">{current.text}</div>
          </div>
          <div className="mb-1 flex gap-1.5">{slides.map((item, index) => <button type="button" key={item.label} aria-label={`Show slide ${index + 1}`} aria-current={index === slide} onClick={() => goTo(index)} className={cn('h-1.5 rounded-full transition-all', index === slide ? 'w-6 bg-[#D8FF72]' : 'w-1.5 bg-white/25')}/>)}</div>
        </div>
      </div>
      <div className="mt-7 flex items-center gap-6 text-[10px] font-bold text-white/45"><span className="flex items-center gap-2"><Icon name="shield" size={15}/>Secure payments</span><span className="flex items-center gap-2"><Icon name="clock" size={15}/>24/7 booking</span><span className="flex items-center gap-2"><Icon name="wallet" size={15}/>Fast payouts</span></div>
    </div>
  </section>
}
