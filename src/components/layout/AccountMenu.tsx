import { ArrowRight, Building2, ChevronUp, LogOut, type LucideIcon } from 'lucide-react'
import { InitialsTile } from '@/components/ui/misc'
import { cn } from '@/lib/cn'
import { useAccountMenu } from './hooks'

function MenuItem({ icon: ItemIcon, title, detail, danger = false, onClick }: { icon: LucideIcon; title: string; detail: string; danger?: boolean; onClick: () => void }) {
  return <button type="button" role="menuitem" onClick={onClick} className={cn('group flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors', danger ? 'hover:bg-[#FFF3F1]' : 'hover:bg-[#F2F6F1]')}>
    <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-lg', danger ? 'bg-[#FFF0EE] text-[#C2483D]' : 'bg-[#EDF4EF] text-[#24764F]')}><ItemIcon size={17}/></span>
    <span className="min-w-0 flex-1">
      <span className={cn('block text-xs font-extrabold', danger ? 'text-[#C2483D]' : 'text-[#173A2E]')}>{title}</span>
      <span className="mt-0.5 block truncate text-[10px] font-semibold text-[#8A9C93]">{detail}</span>
    </span>
    {!danger && <ArrowRight size={14} className="text-[#A3B1AA] transition-transform group-hover:translate-x-0.5"/>}
  </button>
}

/** The business block at the foot of the sidebar: opens upward with the current business, Switch business and Log out. */
export function AccountMenu() {
  const { rootRef, ...account } = useAccountMenu()
  return <div ref={rootRef} className="relative mt-auto shrink-0 border-t border-white/10 p-3">
    {account.open && <div role="menu" className="absolute inset-x-3 bottom-full z-40 mb-1 rounded-2xl border border-border bg-white p-2 text-[#173A2E] shadow-[0_20px_50px_rgba(7,28,20,.32)]">
      <div className="flex items-center gap-3 rounded-xl bg-[#F1F7EE] px-2.5 py-2.5">
        <InitialsTile initials={account.businessInitials} image={account.businessLogo} color="bg-[#173A2E] !text-[#D8FF72]" className="h-9 w-9 rounded-lg text-[11px]"/>
        <div className="min-w-0"><p className="truncate text-xs font-extrabold">{account.businessName}</p><p className="mt-0.5 text-[10px] font-semibold text-[#8A9C93]">Current business</p></div>
      </div>
      <div className="mt-1.5 flex flex-col gap-0.5">
        <MenuItem icon={Building2} title="Switch business" detail="Open a different business" onClick={account.switchBusiness}/>
        <div className="mx-2.5 my-1 border-t border-border"/>
        <MenuItem icon={LogOut} title="Log out" detail="Sign out of your account" danger onClick={account.signOut}/>
      </div>
    </div>}
    <button type="button" aria-haspopup="menu" aria-expanded={account.open} onClick={account.toggle} className={cn('flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-white transition-colors', account.open ? 'bg-white/15' : 'hover:bg-white/10')}>
      <InitialsTile initials={account.businessInitials} image={account.businessLogo} color="bg-[#D8FF72]" className="h-9 w-9 rounded-xl text-xs"/>
      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-extrabold">{account.businessName}</span><span className="block truncate text-[11px] font-semibold text-white/45">Business account</span></span>
      <ChevronUp size={16} className={cn('shrink-0 text-white/50 transition-transform', account.open && 'rotate-180')}/>
    </button>
  </div>
}
