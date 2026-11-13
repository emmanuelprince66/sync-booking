import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Skeleton } from './Skeleton'

/** CLIQBOOK's four card fills, in the design's order. */
const STAT_TONES = {
  lime: 'bg-[#D8FF72]',
  mint: 'bg-[#CDEEDC]',
  peach: 'bg-[#FFE1AD]',
  lilac: 'bg-[#DED9FF]',
} as const
export type StatTone = keyof typeof STAT_TONES

/**
 * The coloured stat card (Overview, Bookings). Text is the dark CLIQBOOK green at every
 * level, so label, value and note all pass contrast (4.5:1 or better) on each fill.
 * With `onClick` it is a button (e.g. a shortcut to a filtered list).
 */
export function ColorStatCard({ label, value, note, icon: CardIcon, tone, loading = false, size = 'md', active = false, onClick }: {
  label: string
  value: string
  note?: string
  icon: LucideIcon
  tone: StatTone
  loading?: boolean
  size?: 'md' | 'lg'
  /** Shows the card as the filter currently applied. */
  active?: boolean
  onClick?: () => void
}) {
  const large = size === 'lg'
  const body = <>
    <span className="flex items-center justify-between gap-2">
      <span className={cn('min-w-0 truncate font-black uppercase text-[#2B463B]', large ? 'text-xs tracking-[0.1em]' : 'text-[10px] tracking-[0.12em]')}>{label}</span>
      <span className={cn('grid shrink-0 place-items-center rounded-xl bg-white/60 text-[#173A2E]', large ? 'h-8 w-8' : 'h-7 w-7')}><CardIcon size={16}/></span>
    </span>
    {loading
      ? <><Skeleton className={cn('bg-white/60', large ? 'mt-5 h-[34px] w-24' : 'mt-3 h-8 w-16')}/><Skeleton className="mt-2 h-3 w-28 max-w-full bg-white/60"/></>
      : <>
        <span className={cn('block truncate font-black text-[#0F2A20]', large ? 'mt-5 text-[34px] leading-none tracking-[-0.045em]' : 'mt-3 text-2xl tracking-[-0.02em]')}>{value}</span>
        {note && <span className={cn('block truncate font-bold text-[#334E43]', large ? 'mt-2 text-xs' : 'mt-1 text-[11px]')}>{note}</span>}
      </>}
  </>
  const className = cn(STAT_TONES[tone], 'block w-full min-w-0 rounded-2xl text-left transition hover:-translate-y-0.5', large ? 'min-h-[154px] p-5' : 'p-4', active && 'ring-2 ring-[#173A2E] ring-offset-2')
  return onClick
    ? <button type="button" onClick={onClick} aria-pressed={active} className={className}>{body}</button>
    : <div className={className}>{body}</div>
}
