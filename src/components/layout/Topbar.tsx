import { Bell, Menu } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { useMobileSidebar, useNotificationBell, useTopbar } from './hooks'
import { ProfileMenu } from './ProfileMenu'

const iconButtonClass = 'relative grid h-10 w-10 place-items-center rounded-xl border border-border bg-white text-[#476057] transition hover:-translate-y-0.5 hover:border-[#9DB1A9] hover:text-[#173A2E]'

function NotificationBell() {
  const { rootRef, ...bell } = useNotificationBell()
  return <div ref={rootRef} className="relative">
    <button type="button" aria-label={bell.unread > 0 ? `Notifications (${bell.unread} unread)` : 'Notifications'} aria-expanded={bell.open} onClick={bell.toggle} className={iconButtonClass}>
      <Bell size={18}/>
      {bell.unread > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-[#F36C4E] box-content"/>}
    </button>
    {bell.open && <div className="absolute right-0 top-12 z-40 w-[min(320px,calc(100vw-2.5rem))] rounded-2xl border border-border bg-white p-2 shadow-[0_20px_50px_rgba(23,58,46,.18)] max-[420px]:-right-12">
      <div className="flex items-center justify-between px-2.5 py-2"><p className="text-sm font-black text-[#173A2E]">Notifications</p>{bell.unread > 0 && <button type="button" onClick={bell.markAllRead} className="text-[11px] font-extrabold text-[#24764F]">Mark all read</button>}</div>
      <div className="flex max-h-72 flex-col gap-0.5 overflow-y-auto">
        {bell.isLoading && <div className="flex flex-col gap-2 p-2.5"><Skeleton className="h-3 w-full"/><Skeleton className="h-3 w-2/3"/></div>}
        {!bell.isLoading && bell.notifications.length === 0 && <p className="px-2.5 py-6 text-center text-xs font-semibold text-[#8A9C93]">You’re all caught up.</p>}
        {bell.notifications.map(item => <div key={item.id} className={cn('rounded-xl px-2.5 py-2', !item.isRead && 'bg-[#F4FFE0]')}><p className="text-xs font-bold leading-relaxed text-[#29483B]">{item.message}</p><p className="mt-0.5 text-[10px] font-semibold text-[#8A9C93]">{item.when}</p></div>)}
      </div>
    </div>}
  </div>
}

/** The same bar on every page: who's signed in, their verification and which business they're managing. Pages show their own titles below. */
export function Topbar() {
  const bar = useTopbar()
  const { openMenu } = useMobileSidebar()
  return <header className="sticky top-0 z-20 flex h-[74px] shrink-0 items-center justify-between gap-3 border-b border-border bg-[#F7F9F5]/90 px-4 backdrop-blur sm:px-5 md:h-[86px] md:px-8">
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <button type="button" aria-label="Open menu" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-white lg:hidden" onClick={openMenu}><Menu size={19}/></button>
      <div className="min-w-0 flex-1">
        {/* Phones: "Welcome back," sits above the name so the full name fits. */}
        <p className="text-[10px] font-semibold leading-none text-[#82988E] sm:hidden">Welcome back,</p>
        <div className="mt-1 flex min-w-0 items-center gap-1.5 sm:mt-0 sm:gap-2">
          <p className="min-w-0 truncate text-sm font-black tracking-[-0.01em] text-[#173A2E] sm:text-[19px]">
            <span className="hidden sm:inline">Welcome back{bar.firstName && ', '}</span>
            <span className="text-[#24764F]">{bar.firstName}</span>
          </p>
          {bar.verification && <span className={cn('shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-extrabold sm:px-2 sm:text-[10px]', bar.verification.ok ? 'bg-[#E2F7E9] text-[#157443]' : 'bg-[#FFF1CB] text-[#946000]')}>{bar.verification.text}</span>}
        </div>
        <p className="hidden truncate text-[11px] font-semibold text-[#82988E] sm:block">{bar.businessName ? `Managing ${bar.businessName}` : 'Your dashboard'} · {bar.date}</p>
      </div>
    </div>
    <div className="flex shrink-0 items-center gap-2">
      <NotificationBell/>
      <div className="hidden h-7 w-px bg-border sm:block" aria-hidden="true"/>
      <ProfileMenu/>
    </div>
  </header>
}
