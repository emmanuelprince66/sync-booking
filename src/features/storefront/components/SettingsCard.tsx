import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

/** One storefront section: icon, title, one line on what it does, then its controls. */
export function SettingsCard({ icon: SectionIcon, title, description, action, children, className }: {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return <section className={cn('min-w-0', className)}>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#EDF4EF] text-[#24764F]"><SectionIcon size={18}/></span>
        <div className="min-w-0"><h2 className="text-base font-black text-[#173A2E]">{title}</h2><p className="mt-0.5 text-xs font-semibold leading-relaxed text-[#8A9C93]">{description}</p></div>
      </div>
      {action}
    </div>
    <div className="mt-5">{children}</div>
  </section>
}

/** Discard / Save row: the note appears once the section has unsaved changes. */
export function CardActions({ dirty, saving, onReset, onSave, saveLabel = 'Save changes', type = 'button' }: {
  dirty: boolean
  saving: boolean
  onReset: () => void
  onSave?: () => void
  saveLabel?: string
  type?: 'button' | 'submit'
}) {
  return <div className="mt-6 flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-end">
    {dirty && <span className="text-[11px] font-bold text-[#946000] sm:mr-auto">You have unsaved changes</span>}
    <Button variant="ghost" onClick={onReset} disabled={!dirty || saving}>Discard</Button>
    <Button type={type} onClick={onSave} loading={saving} disabled={!dirty}>{saveLabel}</Button>
  </div>
}

/** Small uppercase sub-heading inside a section. */
export function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="mb-4 mt-6 text-[10px] font-black uppercase tracking-[0.12em] text-[#7D9188]">{children}</p>
}
