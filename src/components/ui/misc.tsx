import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Button } from './Button'
import { Icon } from './Icon'

/** The one back button: rotated arrow plus label, on every sub-page, nested view and multi-step flow. */
export function BackLink({ label, onClick, className }: { label: string; onClick: () => void; className?: string }) {
  return <button type="button" onClick={onClick} className={cn('inline-flex items-center gap-1.5 text-xs font-extrabold text-[#24764F] transition-colors hover:text-[#173A2E]', className)}><span className="rotate-180"><Icon name="arrow" size={14}/></span>{label}</button>
}

export function PageLoader() {
  return <div className="flex min-h-[40vh] items-center justify-center" role="status" aria-label="Loading">
    <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#329661] border-t-transparent"/>
  </div>
}

/** The heading + subtitle block on top of every screen, with its actions on the right. */
export function PageTitle({ title, subtitle, actions, className }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; className?: string }) {
  return <div className={cn('mb-6 flex flex-wrap items-end justify-between gap-4', className)}>
    <div className="min-w-0"><h1 className="text-3xl font-black tracking-tight text-[#173A2E]">{title}</h1>{subtitle && <p className="mt-1 text-sm font-semibold text-[#71867C]">{subtitle}</p>}</div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </div>
}

/** Nothing to show yet. */
export function EmptyState({ icon, title, text, action, className }: { icon?: ReactNode; title: string; text?: string; action?: ReactNode; className?: string }) {
  return <div className={cn('px-6 py-12 text-center', className)}>
    {icon && <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-[#EDF4EF] text-[#24764F]">{icon}</span>}
    <p className="text-sm font-black text-[#173A2E]">{title}</p>
    {text && <p className="mx-auto mt-1 max-w-sm text-xs font-semibold leading-relaxed text-[#8A9C93]">{text}</p>}
    {action && <div className="mt-4 flex justify-center">{action}</div>}
  </div>
}

/** A request failed: says so and offers a retry. */
export function ErrorState({ title = 'We couldn’t load this', onRetry, className }: { title?: string; onRetry?: () => void; className?: string }) {
  return <div className={cn('rounded-2xl border border-[#F3D9D5] bg-[#FFF8F6] px-6 py-10 text-center', className)}>
    <p className="text-sm font-extrabold text-[#9A3B2F]">{title}</p>
    <p className="mt-1 text-xs font-semibold text-[#9A6B63]">Check your connection and try again.</p>
    {onRetry && <Button variant="outline" onClick={onRetry} className="mt-4">Try again</Button>}
  </div>
}

/** Coloured tile holding initials or a small image. */
export function InitialsTile({ initials, color, image, className }: { initials: string; color?: string; image?: string; className?: string }) {
  return image
    ? <img src={image} alt="" className={cn('shrink-0 object-cover', className)}/>
    : <span className={cn('grid shrink-0 place-items-center font-black text-[#173A2E]', color, className)}>{initials}</span>
}

/** The design's tab pills (bookings filter). */
export function PillTabs<T extends string>({ value, onChange, options, className }: { value: T; onChange: (value: T) => void; options: readonly { value: T; label: string }[]; className?: string }) {
  return <div role="tablist" className={cn('no-scrollbar flex max-w-full gap-1 overflow-x-auto rounded-xl bg-[#F1F5F0] p-1', className)}>
    {options.map(option => <button key={option.value} type="button" role="tab" aria-selected={value === option.value} onClick={() => onChange(option.value)} className={cn('whitespace-nowrap rounded-lg px-3 py-2 text-xs font-extrabold transition', value === option.value ? 'bg-white text-[#173A2E] shadow-sm' : 'text-[#71867C]')}>{option.label}</button>)}
  </div>
}

/** Two or more side-by-side selectable boxes (paid now / pay later, payment method). */
export function ChoiceButton({ selected, tone = 'green', onClick, children }: { selected: boolean; tone?: 'green' | 'amber'; onClick: () => void; children: ReactNode }) {
  return <button type="button" aria-pressed={selected} onClick={onClick} className={cn('rounded-xl border px-3 py-3 text-xs font-extrabold transition', !selected && 'border-border text-[#72877D]', selected && tone === 'green' && 'border-[#329661] bg-[#E8F7ED] text-[#176D43]', selected && tone === 'amber' && 'border-[#C98A27] bg-[#FFF5DE] text-[#875B13]')}>{children}</button>
}
