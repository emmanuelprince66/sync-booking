import { ArrowRight, WandSparkles, X } from 'lucide-react'
import type { CSSProperties } from 'react'
import { NavLink } from 'react-router'
import { Logo } from '@/components/ui/Logo'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { paths, setupPath } from '@/routes/paths'
import { AccountMenu } from './AccountMenu'
import { useMobileSidebar, useSidebar } from './hooks'
import { navItems } from './nav'

/** Logo, links, booking page card and the account block. Shared by the desktop sidebar and the mobile drawer. */
/**
 * Active colours are inline and untransitioned: animating out of the hover state could leave
 * the background stuck transparent with the text already its final colour, hiding the link.
 */
const activeLinkStyle = ({ isActive }: { isActive: boolean }): CSSProperties | undefined =>
  isActive ? { backgroundColor: '#D8FF72', color: '#173A2E' } : undefined

function SidebarContent({ onNavigate, onClose }: { onNavigate?: () => void; onClose?: () => void }) {
  const sidebar = useSidebar()
  return <>
    <div className="flex h-[86px] shrink-0 items-center justify-between px-6">
      <NavLink to={paths.overview} onClick={onNavigate} aria-label="CLIQBOOK overview"><Logo inverse/></NavLink>
      {onClose && <button type="button" aria-label="Close menu" className="text-white/50" onClick={onClose}><X size={20}/></button>}
    </div>

    <nav aria-label="Main" className="flex shrink-0 flex-col gap-1 px-4">
      <p className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/35">Workspace</p>
      {navItems.map(item => {
        const NavIcon = item.icon
        const count = sidebar.counts[item.id]
        return <NavLink key={item.id} to={item.to} end={item.to === paths.overview} onClick={onNavigate} style={activeLinkStyle} className={({ isActive }) => cn('group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold', isActive ? 'bg-[#D8FF72] text-[#173A2E]' : 'text-white/60 transition-colors hover:bg-white/[0.07] hover:text-white')}>
          {({ isActive }) => <>
            <NavIcon size={18} strokeWidth={isActive ? 2.5 : 2}/>
            <span className="flex-1 text-left">{item.label}</span>
            {count ? <span className={cn('grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] font-black', isActive ? 'bg-[#173A2E] text-white' : 'bg-white/10 text-white/60')}>{count}</span> : null}
          </>}
        </NavLink>
      })}
    </nav>

    <div className="m-4 mt-6 shrink-0 rounded-2xl bg-[#214C3D] p-4">
      {sidebar.profileLoaded
        ? <>
          <div className="mb-3 flex items-center gap-2 text-[#D8FF72]"><WandSparkles size={16}/><span className="text-xs font-extrabold">{sidebar.hasBookingPage ? 'Your page is live' : 'Finish your page'}</span></div>
          <p className="break-words text-[11px] leading-relaxed text-white/55">{sidebar.hasBookingPage ? `${sidebar.bookingHost} is ready to receive bookings.` : 'Set up your storefront to get a public booking link.'}</p>
        </>
        : <div className="flex flex-col gap-2"><Skeleton className="h-4 w-28 bg-white/10"/><Skeleton className="h-8 w-full bg-white/10"/></div>}
      <NavLink to={setupPath('storefront')} onClick={onNavigate} className="mt-3 flex items-center gap-1.5 text-xs font-extrabold text-white">View storefront <ArrowRight size={13}/></NavLink>
    </div>

    <AccountMenu onNavigate={onNavigate}/>
  </>
}

/** Fixed sidebar on large screens. */
export function Sidebar() {
  return <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col overflow-y-auto bg-[#173A2E] text-white lg:flex"><SidebarContent/></aside>
}

/** The same sidebar sliding in from the left on phones and tablets (opened from the top bar). */
export function MobileSidebar() {
  const { open, close } = useMobileSidebar()
  return <Modal open={open} onClose={close} placement="left" title="Main menu" overlayClassName="bg-[#071C14]/45 lg:hidden" panelClassName="flex h-full w-[248px] max-w-[85vw] animate-[drawerIn_.22s_ease-out] flex-col overflow-y-auto bg-[#173A2E] text-white">
    <SidebarContent onNavigate={close} onClose={close}/>
  </Modal>
}
