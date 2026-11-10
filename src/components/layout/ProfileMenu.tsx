import { Building2, ChevronDown, CircleHelp, LogOut, Repeat2, ShieldCheck, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useProfileMenu } from './hooks'

function Avatar({ initials, className }: { initials: string; className: string }) {
  return <span className={cn('grid shrink-0 place-items-center rounded-full bg-[#173A2E] font-black text-[#D8FF72]', className)}>{initials}</span>
}

function Item({ icon: ItemIcon, label, onClick, badge, danger = false }: { icon: LucideIcon; label: string; onClick: () => void; badge?: { text: string; ok: boolean }; danger?: boolean }) {
  return <button type="button" role="menuitem" onClick={onClick} className={cn('flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-bold transition-colors', danger ? 'text-[#C2483D] hover:bg-[#FFF3F1]' : 'text-[#29483B] hover:bg-[#F2F6F1]')}>
    <ItemIcon size={16} className={danger ? 'text-[#C2483D]' : 'text-[#82988E]'}/>
    <span className="flex-1">{label}</span>
    {badge && <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-extrabold', badge.ok ? 'bg-[#E2F7E9] text-[#157443]' : 'bg-[#FFF1CB] text-[#946000]')}>{badge.text}</span>}
  </button>
}

/** Profile dropdown in the top bar, as in sync-shipping and sink-inventory's TopBar. */
export function ProfileMenu() {
  const { rootRef, ...menu } = useProfileMenu()
  return <div ref={rootRef} className="relative">
    <button type="button" aria-label="Account menu" aria-haspopup="menu" aria-expanded={menu.open} onClick={menu.toggle} className={cn('flex h-10 items-center gap-2 rounded-xl px-1 transition-colors md:px-1.5 md:pr-2.5', menu.open ? 'bg-[#EDF3EF]' : 'hover:bg-[#EDF3EF]')}>
      <Avatar initials={menu.initials} className="h-8 w-8 text-[11px]"/>
      <span className="hidden flex-col items-start md:flex">
        <span className="max-w-[120px] truncate text-xs font-extrabold text-[#173A2E]">{menu.firstName || 'Your account'}</span>
        <span className="text-[10px] font-semibold text-[#82988E]">{menu.roleLabel}</span>
      </span>
      <ChevronDown size={15} className={cn('hidden text-[#82988E] transition-transform md:block', menu.open && 'rotate-180')}/>
    </button>
    {menu.open && <div role="menu" className="absolute right-0 top-12 z-40 w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-border bg-white p-1.5 shadow-[0_20px_50px_rgba(23,58,46,.18)]">
      <div className="flex items-center gap-3 rounded-xl bg-[#F1F7EE] px-3 py-3">
        <Avatar initials={menu.initials} className="h-10 w-10 text-xs"/>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-extrabold text-[#173A2E]">{menu.fullName || 'Your account'}</p>
          <p className="mt-0.5 truncate text-[10px] font-semibold text-[#8A9C93]">{menu.email}</p>
          <span className="mt-1.5 inline-block rounded-full bg-white px-2 py-0.5 text-[9px] font-extrabold text-[#24764F]">{menu.roleLabel}</span>
        </div>
      </div>
      <div className="flex flex-col gap-0.5 py-1">
        {menu.isOwner && <Item icon={Building2} label="Business settings" onClick={menu.goToSettings}/>}
        {menu.isOwner && <Item icon={ShieldCheck} label="KYC verification" onClick={menu.goToKyc} badge={menu.kycBadge}/>}
        <Item icon={Repeat2} label="Switch business" onClick={menu.switchBusiness}/>
        <Item icon={CircleHelp} label="Help & support" onClick={menu.openHelp}/>
      </div>
      <div className="mx-2 border-t border-border"/>
      <div className="py-1"><Item icon={LogOut} label="Sign out" danger onClick={menu.signOut}/></div>
    </div>}
  </div>
}
