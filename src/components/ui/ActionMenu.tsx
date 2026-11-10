import { MoreHorizontal } from 'lucide-react'
import type { ReactNode } from 'react'
import { useMenu } from '@/hooks/useMenu'
import { cn } from '@/lib/cn'

export type ActionMenuItem = { label: string; icon?: ReactNode; danger?: boolean; onSelect: () => void }

/** The design's "…" button, opening a small list of actions for a row or card. */
export function ActionMenu({ label, items }: { label: string; items: ActionMenuItem[] }) {
  const { open, toggle, close, rootRef } = useMenu()
  return <div ref={rootRef} className="relative shrink-0">
    <button type="button" aria-label={label} aria-haspopup="menu" aria-expanded={open} onClick={toggle} className="grid h-8 w-8 place-items-center rounded-lg text-[#82988E] hover:bg-[#F0F4F1]"><MoreHorizontal size={17}/></button>
    {open && <div role="menu" className="absolute right-0 top-9 z-30 flex w-48 flex-col gap-0.5 rounded-xl border border-border bg-white p-1.5 shadow-[0_14px_35px_rgba(23,58,46,0.14)]">
      {items.map(item => <button key={item.label} type="button" role="menuitem" onClick={() => { close(); item.onSelect() }} className={cn('flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-extrabold', item.danger ? 'text-[#C2483D] hover:bg-[#FFF3F1]' : 'text-[#405B50] hover:bg-[#F2F6F1]')}>{item.icon}{item.label}</button>)}
    </div>}
  </div>
}
