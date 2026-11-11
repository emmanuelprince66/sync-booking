import { ArrowRightLeft, MapPin, Phone, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { InitialsTile } from '@/components/ui/misc'
import { cn } from '@/lib/cn'
import type { BranchCardModel } from '../hooks/useBranchesPage'

/** One branch: who it is, where, how many staff, and the two things you do with it. */
export function BranchCard({ card, onSwitch, onManageStaff }: { card: BranchCardModel; onSwitch: () => void; onManageStaff: () => void }) {
  return <article className={cn('flex min-w-0 flex-col rounded-2xl border bg-white p-5', card.isCurrent ? 'border-[#329661] ring-4 ring-[#329661]/10' : 'border-border')}>
    <div className="flex items-start gap-3">
      <InitialsTile initials={card.initials} image={card.business.logo || undefined} color="bg-[#EDF4EF] text-[#24764F]" className="h-12 w-12 rounded-xl border border-[#E7EDE9] text-sm"/>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h2 className="truncate text-base font-black text-[#173A2E]">{card.name}</h2>
          {card.isCurrent && <span className="shrink-0 rounded-full bg-[#E2F7E9] px-2 py-0.5 text-[9px] font-extrabold uppercase text-[#24764F]">Current</span>}
        </div>
        {card.business.type && <span className="mt-1 inline-flex rounded-full bg-[#F1F5F2] px-2 py-0.5 text-[10px] font-bold text-[#5E7268]">{card.business.type}</span>}
      </div>
    </div>

    <dl className="mt-4 flex flex-1 flex-col gap-2 text-xs font-semibold text-[#60796E]">
      <div className="flex items-start gap-2"><MapPin size={14} className="mt-0.5 shrink-0 text-[#8BA096]"/><dt className="sr-only">Address</dt><dd className="min-w-0 break-words">{card.address}</dd></div>
      {card.contact && <div className="flex items-start gap-2"><Phone size={14} className="mt-0.5 shrink-0 text-[#8BA096]"/><dt className="sr-only">Contact</dt><dd className="min-w-0 break-all">{card.contact}</dd></div>}
      <div className="flex items-center gap-2"><Users size={14} className="shrink-0 text-[#8BA096]"/><dt className="sr-only">Staff</dt><dd>{card.staff === null ? <span className="inline-block h-3 w-16 animate-pulse rounded bg-[#EEF3F0] align-middle"/> : `${card.staff} staff ${card.staff === 1 ? 'member' : 'members'}`}</dd></div>
    </dl>

    <div className="mt-5 grid grid-cols-2 gap-2">
      <Button variant="outline" onClick={onManageStaff} className="h-10 px-3 text-xs"><Users size={15}/> Manage staff</Button>
      {card.isCurrent
        ? <span className="flex h-10 items-center justify-center rounded-xl bg-[#F3F9F4] px-3 text-xs font-extrabold text-[#24764F]">You’re here</span>
        : <Button onClick={onSwitch} className="h-10 px-3 text-xs"><ArrowRightLeft size={15}/> Switch</Button>}
    </div>
  </article>
}
