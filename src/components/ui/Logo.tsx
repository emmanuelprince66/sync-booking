import { cn } from '@/lib/cn'

/** The CLIQBOOK mark alone, from the design. */
export function LogoMark() {
  return <div className="relative h-9 w-9 shrink-0 rounded-[11px] bg-[#D8FF72]">
    <div className="absolute left-[9px] top-[8px] h-[17px] w-[17px] rounded-full border-[3px] border-[#173A2E]"/>
    <div className="absolute bottom-[7px] right-[5px] h-[3px] w-[13px] -rotate-45 rounded-full bg-[#173A2E]"/>
  </div>
}

/** CLIQBOOK by Mycliq logo, from the design. `inverse` is for the dark sidebar and auth panel. */
export function Logo({ inverse = false }: { inverse?: boolean }) {
  return <div className="flex items-center gap-3">
    <LogoMark/>
    <div className="text-left">
      <p className={cn('text-[10px] font-extrabold uppercase tracking-[0.22em]', inverse ? 'text-white/45' : 'text-muted-foreground')}>by Mycliq</p>
      <p className={cn('text-[17px] font-black tracking-tight', inverse ? 'text-white' : 'text-[#173A2E]')}>CLIQBOOK</p>
    </div>
  </div>
}
