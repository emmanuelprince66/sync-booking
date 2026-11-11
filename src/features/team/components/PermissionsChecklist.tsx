import { Check, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import type { PermissionMatrixEditor } from '../hooks/usePermissionMatrix'
import { actionLabel, moduleLabel } from '../permissions'

function CountPill({ count, total }: { count: number; total: number }) {
  const all = count === total
  return <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-extrabold', all ? 'bg-[#E2F7E9] text-[#157443]' : count ? 'bg-[#FFF5DE] text-[#875B13]' : 'bg-[#F1F5F2] text-[#7C8D85]')}>
    {all ? 'All' : count ? `${count} of ${total}` : 'None'}
  </span>
}

/** One row per module (sink's StaffPermissionsMatrix); open a row to tick individual actions. */
export function PermissionsChecklist({ editor }: { editor: PermissionMatrixEditor }) {
  const [openModule, setOpenModule] = useState<string | null>(null)
  const { role, modules, value, onChange, onReset, isCustom, canReset, isLoading, isError, onRetry } = editor

  if (!role) return <p className="rounded-xl border border-dashed border-[#C9D8CF] bg-[#FAFCFA] px-4 py-5 text-center text-xs font-semibold text-[#7C8D85]">Choose a role to see what they’ll be able to do.</p>

  if (isLoading) return <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading permissions">{Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-12 w-full rounded-xl"/>)}</div>

  if (isError || !modules || !value) return <div className="flex flex-col items-start gap-3 rounded-xl border border-[#F3D9D5] bg-[#FFF8F6] p-4">
    <p className="text-sm font-semibold text-[#9A3B2F]">Couldn’t load the permissions for this role.</p>
    <Button variant="outline" onClick={onRetry} className="h-9">Try again</Button>
  </div>

  const setActions = (module: string, actions: string[]) => onChange({ ...value, [module]: actions })
  const toggle = (module: string, action: string) => {
    const current = value[module] ?? []
    setActions(module, current.includes(action) ? current.filter(item => item !== action) : [...current, action])
  }

  return <div className="flex flex-col gap-3">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="text-sm font-black text-[#173A2E]">Permissions</h3>
        <p className="mt-0.5 text-xs font-semibold text-[#8A9C93]">{isCustom ? 'Customised for this person.' : 'Using this role’s standard permissions.'}</p>
      </div>
      {isCustom && canReset && <Button variant="outline" onClick={onReset} className="h-9 text-xs">Reset to role defaults</Button>}
    </div>

    <div className="flex flex-col gap-2">
      {Object.entries(modules).map(([module, actions]) => {
        const enabled = value[module] ?? []
        const count = actions.filter(action => enabled.includes(action)).length
        const isOpen = openModule === module
        const allOn = count === actions.length
        return <div key={module} className={cn('overflow-hidden rounded-xl border bg-white', isOpen ? 'border-[#329661]' : 'border-border')}>
          <button type="button" aria-expanded={isOpen} onClick={() => setOpenModule(isOpen ? null : module)} className={cn('flex w-full items-center justify-between gap-3 px-4 py-3 text-left', isOpen ? 'bg-[#F3F9F4]' : 'hover:bg-[#FAFCFA]')}>
            <span className="text-sm font-extrabold text-[#29483B]">{moduleLabel(module)}</span>
            <span className="flex shrink-0 items-center gap-2"><CountPill count={count} total={actions.length}/><ChevronDown size={16} className={cn('text-[#8BA096] transition-transform', isOpen && 'rotate-180')}/></span>
          </button>
          {isOpen && <div className="border-t border-border px-4 pb-4 pt-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold text-[#7C8D85]">{count} of {actions.length} allowed</p>
              {actions.length > 1 && <button type="button" onClick={() => setActions(module, allOn ? [] : [...actions])} className="rounded-md px-2 py-1 text-xs font-extrabold text-[#24764F] hover:bg-[#EDF4EF]">{allOn ? 'Clear all' : 'Select all'}</button>}
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {actions.map(action => {
                const checked = enabled.includes(action)
                return <label key={action} className={cn('flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 transition-colors', checked ? 'border-[#329661]/40 bg-[#F3F9F4]' : 'border-border hover:bg-[#FAFCFA]')}>
                  <input type="checkbox" checked={checked} onChange={() => toggle(module, action)} className="peer sr-only"/>
                  <span className={cn('flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border peer-focus-visible:ring-4 peer-focus-visible:ring-[#173A2E]/15', checked ? 'border-[#173A2E] bg-[#173A2E] text-white' : 'border-[#CAD6CF] bg-white')}>{checked && <Check size={12} strokeWidth={3}/>}</span>
                  <span className={cn('text-sm', checked ? 'font-bold text-[#29483B]' : 'font-semibold text-[#60796E]')}>{actionLabel(module, action)}</span>
                </label>
              })}
            </div>
          </div>}
        </div>
      })}
    </div>
  </div>
}
